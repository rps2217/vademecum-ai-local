import { test, expect } from '@playwright/test';
import {
  authenticate,
  resetAll,
  resetSession,
  TEST_PIN,
} from './helpers/auth';

/**
 * Tests E2E - Autenticación por PIN
 *
 * Flujo: onboarding (primera vez) → login (sesiones posteriores) → unlock.
 * El hash del PIN se guarda en localStorage; el flag de sesión
 * en sessionStorage (se limpia al cerrar el navegador).
 */

/** Helper: completa el onboarding (primera vez) y entra a la app. */
async function completeOnboarding(page: import('@playwright/test').Page) {
  await resetAll(page);
  await page.goto('/');
  await authenticate(page);
}

test.describe('Autenticación', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await resetAll(page);
    await page.reload();
  });

  test('debería mostrar onboarding la primera vez (sin cuenta)', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: /configuración inicial/i })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
  });

  test('debería configurar PIN en onboarding y entrar a la app', async ({ page }) => {
    await completeOnboarding(page);

    const searchInput = page.getByPlaceholder(/buscar/i).or(page.getByRole('searchbox')).first();
    await expect(searchInput).toBeVisible({ timeout: 10000 });
  });

  test('debería mostrar login al recargar (cuenta ya creada)', async ({ page }) => {
    await completeOnboarding(page);

    await resetSession(page);
    await page.reload();

    await expect(page.getByRole('heading', { name: /vademecum/i })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toContainText(/desbloquear/i);
  });

  test('debería rechazar PIN incorrecto en login', async ({ page }) => {
    await completeOnboarding(page);

    await resetSession(page);
    await page.reload();

    await page.locator('input[type="password"]').first().waitFor({ state: 'visible', timeout: 10000 });
    await page.locator('input[type="password"]').first().fill('9999');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(/pin incorrecto/i)).toBeVisible({ timeout: 5000 });
  });

  test('debería desbloquear con PIN correcto', async ({ page }) => {
    await completeOnboarding(page);

    await resetSession(page);
    await page.reload();

    await page.locator('input[type="password"]').first().waitFor({ state: 'visible', timeout: 10000 });
    await page.locator('input[type="password"]').first().fill(TEST_PIN);
    await page.locator('button[type="submit"]').click();

    const searchInput = page.getByPlaceholder(/buscar/i).or(page.getByRole('searchbox')).first();
    await expect(searchInput).toBeVisible({ timeout: 15000 });
  });
});
