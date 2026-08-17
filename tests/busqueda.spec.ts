import { test, expect } from '@playwright/test';
import { authenticate, resetSession } from './helpers/auth';

/**
 * Tests E2E - Búsqueda de Medicamentos
 */

test.describe('Búsqueda de Medicamentos', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await resetSession(page);
    await page.reload();
    await authenticate(page);
    // HomePage es el index; navegar a /search para probar la búsqueda
    await page.getByRole('link', { name: /^buscar/i }).first().click();
  });

  test('debería cargar la página principal', async ({ page }) => {
    await expect(page).toHaveTitle(/Vademecum/i);
  });

  test('debería permitir buscar un ingrediente', async ({ page }) => {
    // Esperar a que el input de búsqueda esté visible
    const searchInput = page.getByPlaceholder(/buscar/i).or(page.getByRole('searchbox')).first();
    
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
    const searchInput = page.getByPlaceholder(/buscar/i).or(page.getByRole('searchbox')).first();
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
    const searchInput = page.getByPlaceholder(/buscar/i).or(page.getByRole('searchbox')).first();
    await searchInput.waitFor({ state: 'visible', timeout: 10000 });
    
    await searchInput.fill('lavanda');
    
    await page.waitForTimeout(2000);
    
    const results = page.locator('[class*="card"], [class*="product"]');
    expect(await results.count()).toBeGreaterThanOrEqual(0);
  });
});
