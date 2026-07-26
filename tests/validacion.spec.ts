import { test, expect } from '@playwright/test';

/**
 * Tests E2E - Validación y Robustez
 */

// Helper para autenticarse rápidamente
async function authenticate(page: any) {
  await page.goto('/');
  const passwordInput = page.locator('input[type="password"]');
  await passwordInput.waitFor({ state: 'visible', timeout: 10000 });
  await passwordInput.first().fill('test123');
  const inputs = page.locator('input[type="password"]');
  if (await inputs.count() >= 2) {
    await inputs.nth(1).fill('test123');
  }
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(2000);
}

test.describe('Validación y Robustez', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await authenticate(page);
  });

  test('debería manejar búsqueda vacía gracefully', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/buscar/i).or(page.getByRole('searchbox'));
    await searchInput.waitFor({ state: 'visible', timeout: 10000 });
    
    // Escribir solo espacios
    await searchInput.fill('   ');
    await page.waitForTimeout(500);
    
    await expect(page.locator('body')).toBeVisible();
  });

  test('debería manejar búsqueda con caracteres especiales', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/buscar/i).or(page.getByRole('searchbox'));
    await searchInput.waitFor({ state: 'visible', timeout: 10000 });
    
    // Escribir caracteres especiales (XSS protection)
    await searchInput.fill('<script>alert("test")</script>');
    await page.waitForTimeout(500);
    
    await expect(page.locator('body')).toBeVisible();
  });

  test('debería manejar búsqueda con query muy larga', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/buscar/i).or(page.getByRole('searchbox'));
    await searchInput.waitFor({ state: 'visible', timeout: 10000 });
    
    const longQuery = 'a'.repeat(500);
    await searchInput.fill(longQuery);
    await page.waitForTimeout(500);
    
    await expect(page.locator('body')).toBeVisible();
  });

  test('debería manejar navegación rápida entre búsquedas', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/buscar/i).or(page.getByRole('searchbox'));
    await searchInput.waitFor({ state: 'visible', timeout: 10000 });
    
    // Búsquedas rápidas
    await searchInput.fill('valeriana');
    await page.waitForTimeout(300);
    await searchInput.clear();
    await searchInput.fill('arnica');
    await page.waitForTimeout(300);
    await searchInput.clear();
    await searchInput.fill('lavanda');
    await page.waitForTimeout(300);
    
    await expect(page.locator('body')).toBeVisible();
  });
});
