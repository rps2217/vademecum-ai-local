import { test, expect } from '@playwright/test';

/**
 * Tests E2E - Autenticación E2EE
 *
 * Flujo: onboarding (primera vez) → login (sesiones posteriores) → unlock.
 * Las claves cifradas se guardan en localStorage; el flag de sesión
 * en sessionStorage (se limpia al cerrar el navegador).
 */

const TEST_PASSWORD = 'Test1234!';

/** Helper: completa el onboarding (primera vez). */
async function completeOnboarding(page: import('@playwright/test').Page) {
  await page.goto('/');
  // Esperar a que aparezca el formulario de onboarding
  await page.locator('input[type="password"]').first().waitFor({ state: 'visible', timeout: 10000 });

  // Llenar contraseña + confirmación
  await page.locator('input[type="password"]').nth(0).fill(TEST_PASSWORD);
  await page.locator('input[type="password"]').nth(1).fill(TEST_PASSWORD);
  await page.locator('button[type="submit"]').click();

  // Esperar a que aparezca la frase de recuperación (step 3)
  await page.waitForTimeout(3000);

  // Completar onboarding
  const completeBtn = page.locator('button', { hasText: /completar/i });
  await completeBtn.click();
  await page.waitForTimeout(1000);
}

test.describe('Autenticación', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload();
  });

  test('debería mostrar onboarding la primera vez (sin cuenta)', async ({ page }) => {
    await page.goto('/');

    // Sin cuenta → onboarding con título "Configuración inicial"
    await expect(page.getByRole('heading', { name: /configuración inicial/i })).toBeVisible({ timeout: 10000 });
    // Debe haber campos de contraseña
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
  });

  test('debería configurar contraseña en onboarding y entrar a la app', async ({ page }) => {
    await completeOnboarding(page);

    // Después del onboarding, debería estar en la app (buscar input de búsqueda)
    const searchInput = page.getByPlaceholder(/buscar/i).or(page.getByRole('searchbox'));
    await expect(searchInput).toBeVisible({ timeout: 10000 });
  });

  test('debería mostrar login al recargar (cuenta ya creada)', async ({ page }) => {
    // Primero completar onboarding
    await completeOnboarding(page);

    // Limpiar solo la sesión (no el keypair en localStorage)
    await page.evaluate(() => sessionStorage.clear());
    await page.reload();

    // Ahora debe mostrar login, no onboarding
    await expect(page.getByRole('heading', { name: /vademecum/i })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[type="password"]')).toBeVisible();
    // El botón debe decir "Desbloquear"
    await expect(page.locator('button[type="submit"]')).toContainText(/desbloquear/i);
  });

  test('debería rechazar contraseña incorrecta en login', async ({ page }) => {
    await completeOnboarding(page);

    // Limpiar sesión y recargar para ir al login
    await page.evaluate(() => sessionStorage.clear());
    await page.reload();

    // Esperar el login
    await page.locator('input[type="password"]').first().waitFor({ state: 'visible', timeout: 10000 });

    // Intentar con contraseña incorrecta
    await page.locator('input[type="password"]').first().fill('wrongpassword');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(1000);

    // Debe mostrar error
    await expect(page.getByText(/contraseña incorrecta/i)).toBeVisible({ timeout: 5000 });
  });

  test('debería desbloquear con contraseña correcta', async ({ page }) => {
    await completeOnboarding(page);

    // Limpiar sesión y recargar para ir al login
    await page.evaluate(() => sessionStorage.clear());
    await page.reload();

    // Desbloquear con la contraseña correcta
    await page.locator('input[type="password"]').first().waitFor({ state: 'visible', timeout: 10000 });
    await page.locator('input[type="password"]').first().fill(TEST_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(2000);

    // Debe entrar a la app
    const searchInput = page.getByPlaceholder(/buscar/i).or(page.getByRole('searchbox'));
    await expect(searchInput).toBeVisible({ timeout: 10000 });
  });
});
