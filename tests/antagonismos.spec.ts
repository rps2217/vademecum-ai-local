import { test, expect } from '@playwright/test';

/**
 * Tests E2E - Checker de interacciones (AnalysisPage)
 *
 * El farmacéutico selecciona 2-5 ingredientes y obtiene sinergias,
 * antagonismos, alertas de perfil de cliente y pares sin datos.
 */

async function authenticate(page: import('@playwright/test').Page) {
  await page.goto('/');

  const searchInput = page.getByPlaceholder(/buscar/i).or(page.getByRole('searchbox'));
  const alreadyIn = await searchInput.first().isVisible({ timeout: 2000 }).catch(() => false);
  if (alreadyIn) return;

  const passwordInput = page.locator('input[type="password"]');
  await passwordInput.first().waitFor({ state: 'visible', timeout: 10000 });

  const unlockBtn = page.locator('button[type="submit"]', { hasText: /desbloquear/i });
  const isLogin = await unlockBtn.isVisible({ timeout: 2000 }).catch(() => false);

  if (isLogin) {
    await passwordInput.first().fill('Test1234!');
    await unlockBtn.click();
  } else {
    await passwordInput.nth(0).fill('Test1234!');
    await passwordInput.nth(1).fill('Test1234!');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(3000);
    const completeBtn = page.locator('button', { hasText: /completar/i });
    await completeBtn.click();
  }

  await page.waitForTimeout(2000);
}

test.describe('AnalysisPage - Checker de interacciones', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => sessionStorage.clear());
    await page.reload();
    await authenticate(page);
  });

  test('debería mostrar la página de análisis con selector de ingredientes', async ({ page }) => {
    await page.goto('/analysis');
    await page.waitForTimeout(1000);

    await expect(page.getByRole('heading', { name: /análisis de interacciones/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/selecciona 2 a 5 ingredientes/i)).toBeVisible();
  });

  test('debería buscar y añadir ingredientes al análisis', async ({ page }) => {
    await page.goto('/analysis');
    await page.waitForTimeout(1000);

    const searchInput = page.locator('input[placeholder*="Buscar ingrediente"]');
    await searchInput.fill('valeriana');
    await page.waitForTimeout(1000);

    const firstResult = page.locator('button:has-text("valeriana")').first();
    await expect(firstResult).toBeVisible({ timeout: 5000 });
    await firstResult.click();
    await page.waitForTimeout(500);

    await expect(page.locator('span:has-text("valeriana")')).toBeVisible();
  });

  test('debería mostrar resultados al seleccionar 2 ingredientes relacionados', async ({ page }) => {
    await page.goto('/analysis');
    await page.waitForTimeout(1000);

    const searchInput = page.locator('input[placeholder*="Buscar ingrediente"]');

    await searchInput.fill('valeriana');
    await page.waitForTimeout(1000);
    await page.locator('button:has-text("valeriana")').first().click();
    await page.waitForTimeout(500);

    await searchInput.fill('pasiflora');
    await page.waitForTimeout(1000);
    await page.locator('button:has-text("pasiflora")').first().click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(/sinergias/i)).toBeVisible({ timeout: 5000 });
  });
});
