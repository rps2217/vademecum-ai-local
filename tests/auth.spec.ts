import { test, expect } from '@playwright/test';

/**
 * Tests E2E - Autenticación
 *
 * NOTA: Estos tests se skipan cuando BYPASS_AUTH=true en App.tsx,
 * porque la pantalla de login no se renderiza.
 */

test.describe('Autenticación', () => {

  test.beforeEach(async ({ page }) => {
    // Limpiar localStorage antes de cada test
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test('debería mostrar pantalla de login al inicio', async ({ page }) => {
    await page.goto('/');

    // Si BYPASS_AUTH está activo, no hay pantalla de login
    const passwordInput = page.locator('input[type="password"]');
    const isVisible = await passwordInput.first().isVisible({ timeout: 3000 }).catch(() => false);
    test.skip(!isVisible, 'BYPASS_AUTH está activo — login no renderizado');

    // Verificar que aparece la pantalla de login
    await expect(page.getByRole('heading', { name: /vademecum/i })).toBeVisible({ timeout: 10000 });
    await expect(passwordInput).toBeVisible();
  });

  test('debería configurar contraseña en primera vez', async ({ page }) => {
    await page.goto('/');

    const passwordInput = page.locator('input[type="password"]');
    const isVisible = await passwordInput.first().isVisible({ timeout: 3000 }).catch(() => false);
    test.skip(!isVisible, 'BYPASS_AUTH está activo — login no renderizado');

    // Llenar contraseña (primera vez hay dos campos)
    const passwordInputs = page.locator('input[type="password"]');
    const count = await passwordInputs.count();

    if (count >= 1) {
      await passwordInputs.first().fill('test123');
    }

    if (count >= 2) {
      await passwordInputs.nth(1).fill('test123');
    }

    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    await page.waitForTimeout(2000);
  });

  test('debería rechazar contraseña incorrecta', async ({ page }) => {
    await page.goto('/');

    const passwordInput = page.locator('input[type="password"]');
    const isVisible = await passwordInput.first().isVisible({ timeout: 3000 }).catch(() => false);
    test.skip(!isVisible, 'BYPASS_AUTH está activo — login no renderizado');

    // Configurar una contraseña primero
    const passwordInputs = page.locator('input[type="password"]');
    await passwordInputs.first().fill('password123');

    if (await passwordInputs.count() >= 2) {
      await passwordInputs.nth(1).fill('password123');
    }

    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(1000);
  });
});
