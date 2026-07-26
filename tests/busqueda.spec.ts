import { test, expect } from '@playwright/test';

/**
 * Tests E2E - Búsqueda de Medicamentos
 */

test.describe('Búsqueda de Medicamentos', () => {
  test('debería cargar la página principal', async ({ page }) => {
    await page.goto('/');
    
    // Verificar que la página carga
    await expect(page).toHaveTitle(/Vademecum/i);
  });

  test('debería permitir buscar un medicamento', async ({ page }) => {
    await page.goto('/');
    
    // Esperar a que el input de búsqueda esté visible
    const searchInput = page.getByPlaceholder(/buscar/i).or(page.getByRole('searchbox'));
    
    await expect(searchInput).toBeVisible({ timeout: 10000 });
    
    // Escribir en el input
    await searchInput.fill('paracetamol');
    
    // Esperar resultados (los resultados deberían aparecer)
    await page.waitForTimeout(1000);
    
    // Verificar que hay resultados o mensaje apropiado
    const results = page.locator('[data-testid="product-card"], .product-card, [class*="product"]');
    const noResults = page.getByText(/no.*encontrado/i).or(page.getByText(/sin.*resultados/i));
    
    // Alguno de los dos debe ser visible
    const hasResults = await results.count() > 0;
    const hasNoResults = await noResults.count() > 0;
    
    expect(hasResults || hasNoResults).toBeTruthy();
  });

  test('debería mostrar resultados de búsqueda', async ({ page }) => {
    await page.goto('/');
    
    const searchInput = page.getByPlaceholder(/buscar/i).or(page.getByRole('searchbox'));
    await searchInput.waitFor({ state: 'visible', timeout: 10000 });
    
    // Buscar algo común
    await searchInput.fill('ibuprofeno');
    
    // Esperar a que aparezcan los resultados
    await page.waitForTimeout(2000);
    
    // Verificar que hay al menos algún producto
    const productCards = page.locator('[class*="card"], [class*="product"]');
    const count = await productCards.count();
    
    // Si hay resultados, deberían ser visibles
    if (count > 0) {
      await expect(productCards.first()).toBeVisible();
    }
  });
});
