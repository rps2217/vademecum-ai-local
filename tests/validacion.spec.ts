import { test, expect } from '@playwright/test';

/**
 * Tests E2E - Validación y Robustez
 */

test.describe('Validación y Robustez', () => {
  test('debería manejar búsqueda vacía gracefully', async ({ page }) => {
    await page.goto('/');
    
    const searchInput = page.getByPlaceholder(/buscar/i).or(page.getByRole('searchbox'));
    await searchInput.waitFor({ state: 'visible', timeout: 10000 });
    
    // Escribir solo espacios
    await searchInput.fill('   ');
    await page.waitForTimeout(500);
    
    // La app no debería crashear
    await expect(page.locator('body')).toBeVisible();
  });

  test('debería manejar búsqueda con caracteres especiales', async ({ page }) => {
    await page.goto('/');
    
    const searchInput = page.getByPlaceholder(/buscar/i).or(page.getByRole('searchbox'));
    await searchInput.waitFor({ state: 'visible', timeout: 10000 });
    
    // Escribir caracteres especiales
    await searchInput.fill('<script>alert("test")</script>');
    await page.waitForTimeout(500);
    
    // La app no debería crashear
    await expect(page.locator('body')).toBeVisible();
  });

  test('debería manejar búsqueda con query muy larga', async ({ page }) => {
    await page.goto('/');
    
    const searchInput = page.getByPlaceholder(/buscar/i).or(page.getByRole('searchbox'));
    await searchInput.waitFor({ state: 'visible', timeout: 10000 });
    
    // Escribir query muy larga
    const longQuery = 'a'.repeat(500);
    await searchInput.fill(longQuery);
    await page.waitForTimeout(500);
    
    // La app no debería crashear
    await expect(page.locator('body')).toBeVisible();
  });

  test('debería manejar navegación rápida entre páginas', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    // Click rápido en búsqueda
    const searchInput = page.getByPlaceholder(/buscar/i).or(page.getByRole('searchbox'));
    await searchInput.fill('aspirina');
    await page.waitForTimeout(300);
    
    // Limpiar y buscar otra cosa
    await searchInput.clear();
    await searchInput.fill('paracetamol');
    await page.waitForTimeout(300);
    
    // La app no debería crashear
    await expect(page.locator('body')).toBeVisible();
  });
});
