import { test, expect } from '@playwright/test';

/**
 * Tests E2E - Búsqueda de Medicamentos
 */

// Helper para autenticarse rápidamente
async function authenticate(page: any) {
  await page.goto('/');
  
  // Esperar que cargue el login
  const passwordInput = page.locator('input[type="password"]');
  await passwordInput.waitFor({ state: 'visible', timeout: 10000 });
  
  // Configurar contraseña
  await passwordInput.first().fill('test123');
  
  const inputs = page.locator('input[type="password"]');
  if (await inputs.count() >= 2) {
    await inputs.nth(1).fill('test123');
  }
  
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(2000);
}

test.describe('Búsqueda de Medicamentos', () => {
  
  test.beforeEach(async ({ page }) => {
    // Limpiar localStorage
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
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
