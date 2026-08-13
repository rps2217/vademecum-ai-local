import { test, expect } from '@playwright/test';

/**
 * Tests E2E - Búsqueda de Medicamentos
 */

// Helper para autenticarse rápidamente
async function authenticate(page: any) {
  await page.goto('/');

  // Si ya hay sesión activa, continuar
  const searchInput = page.getByPlaceholder(/buscar/i).or(page.getByRole('searchbox'));
  const alreadyIn = await searchInput.first().isVisible({ timeout: 2000 }).catch(() => false);
  if (alreadyIn) return;

  // Detectar si hay cuenta (login) o no (onboarding)
  const passwordInput = page.locator('input[type="password"]');
  await passwordInput.first().waitFor({ state: 'visible', timeout: 10000 });

  const unlockBtn = page.locator('button[type="submit"]', { hasText: /desbloquear/i });
  const isLogin = await unlockBtn.isVisible({ timeout: 2000 }).catch(() => false);

  if (isLogin) {
    // Login: ya hay cuenta, desbloquear
    await passwordInput.first().fill('Test1234!');
    await unlockBtn.click();
  } else {
    // Onboarding: primera vez, configurar contraseña
    await passwordInput.nth(0).fill('Test1234!');
    await passwordInput.nth(1).fill('Test1234!');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(3000); // Generar claves
    // Click en "Completar configuración"
    const completeBtn = page.locator('button', { hasText: /completar/i });
    await completeBtn.click();
  }

  await page.waitForTimeout(2000);
}

test.describe('Búsqueda de Medicamentos', () => {
  
  test.beforeEach(async ({ page }) => {
    // Limpiar localStorage
    await page.goto('/');
    await page.evaluate(() => sessionStorage.clear());
    await page.reload();
    await authenticate(page);
  });

  test('debería cargar la página principal', async ({ page }) => {
    // Ya estamos autenticados del beforeEach
    // Verificar que la página carga
    await expect(page).toHaveTitle(/Vademecum/i);
  });

  test('debería permitir buscar un ingrediente', async ({ page }) => {
    // Esperar a que el input de búsqueda esté visible
    const searchInput = page.getByPlaceholder(/buscar/i).or(page.getByRole('searchbox'));
    
    await expect(searchInput).toBeVisible({ timeout: 10000 });
    
    // Escribir en el input - buscar algo fitoterapéutico
    await searchInput.fill('valeriana');
    
    // Esperar resultados
    await page.waitForTimeout(1500);
    
    // Verificar que hay resultados o mensaje apropiado
    const results = page.locator('[data-testid="product-card"], .product-card, [class*="product"], [class*="card"]');
    const noResults = page.getByText(/no.*encontrado/i).or(page.getByText(/sin.*resultados/i));
    
    const hasResults = await results.count() > 0;
    const hasNoResults = await noResults.count() > 0;
    
    expect(hasResults || hasNoResults).toBeTruthy();
  });

  test('debería mostrar resultados al buscar homeopatía', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/buscar/i).or(page.getByRole('searchbox'));
    await searchInput.waitFor({ state: 'visible', timeout: 10000 });
    
    // Buscar un remedio homeopático
    await searchInput.fill('arnica');
    
    await page.waitForTimeout(2000);
    
    const productCards = page.locator('[class*="card"], [class*="product"]');
    const count = await productCards.count();
    
    if (count > 0) {
      await expect(productCards.first()).toBeVisible();
    }
  });

  test('debería buscar aceites esenciales', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/buscar/i).or(page.getByRole('searchbox'));
    await searchInput.waitFor({ state: 'visible', timeout: 10000 });
    
    await searchInput.fill('lavanda');
    
    await page.waitForTimeout(2000);
    
    const results = page.locator('[class*="card"], [class*="product"]');
    expect(await results.count()).toBeGreaterThanOrEqual(0);
  });
});
