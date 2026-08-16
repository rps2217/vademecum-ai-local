import type { Page } from '@playwright/test';

/**
 * Helper compartido de autenticación para los tests E2E.
 *
 * Maneja los dos flujos de la app:
 *  - Onboarding (primera vez, sin PIN en localStorage): pide crear un PIN
 *    de 4 dígitos + confirmación.
 *  - Login (PIN ya existe, sesión expirada): pide solo el PIN para
 *    desbloquear.
 *
 * El hash del PIN se guarda en `localStorage` (`vademecum.app_pin`); el flag
 * de sesión en `sessionStorage`. Por eso, para forzar re-unlock entre
 * tests basta con limpiar `sessionStorage` (ver `resetSession`); para forzar
 * onboarding desde cero hay que limpiar también `localStorage` (ver
 * `resetAll`).
 */

export const TEST_PIN = '1234';

/** Limpia SOLO la sesión (mantiene la cuenta en localStorage) → fuerza login. */
export async function resetSession(page: Page): Promise<void> {
  await page.evaluate(() => sessionStorage.clear());
}

/** Limpia sesión Y cuenta → fuerza onboarding desde cero. */
export async function resetAll(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

/**
 * Autentica al usuario, completando onboarding o login según el estado actual.
 * Al terminar, la app está desbloqueada y el input de búsqueda es visible.
 */
export async function authenticate(page: Page): Promise<void> {
  const searchInput = page
    .getByPlaceholder(/buscar/i)
    .or(page.getByRole('searchbox'));
  const alreadyIn = await searchInput
    .first()
    .isVisible({ timeout: 2000 })
    .catch(() => false);
  if (alreadyIn) return;

  const hasPassword = await page
    .locator('input[type="password"]')
    .first()
    .isVisible({ timeout: 3000 })
    .catch(() => false);
  if (!hasPassword) {
    await page.goto('/');
  }

  await unlockInPlace(page);

  await searchInput.first().waitFor({ state: 'visible', timeout: 15000 });
}

/**
 * Desbloquea la sesión SI la página actual es el login (o completa el
 * onboarding si no hay cuenta). A diferencia de `authenticate`, NO navega
 * a '/' — se usa tras un `page.goto('/ruta-protegida')` que, al recargar la
 * app, reinicia `isAuthenticated` y redirige a `/login`.
 */
export async function ensureAuthenticated(page: Page): Promise<void> {
  const searchInput = page
    .getByPlaceholder(/buscar/i)
    .or(page.getByRole('searchbox'));
  const alreadyIn = await searchInput
    .first()
    .isVisible({ timeout: 1500 })
    .catch(() => false);
  if (alreadyIn) return;

  const passwordInput = page.locator('input[type="password"]');
  const hasPassword = await passwordInput
    .first()
    .isVisible({ timeout: 2000 })
    .catch(() => false);
  if (!hasPassword) return;

  await unlockInPlace(page);
}

/**
 * Núcleo compartido: resuelve onboarding o login según el estado, sin navegar
 * a una ruta concreta.
 */
async function unlockInPlace(page: Page): Promise<void> {
  const passwordInput = page.locator('input[type="password"]');
  await passwordInput.first().waitFor({ state: 'visible', timeout: 15000 });

  // Distinguir login vs onboarding por texto distintivo de la página.
  const loginHint = page.getByText(/ingresa tu pin para continuar/i);
  const isLogin = await loginHint.isVisible({ timeout: 5000 }).catch(() => false);

  if (isLogin) {
    // Login: 1 input + botón "Desbloquear".
    await passwordInput.first().fill(TEST_PIN);
    const unlockBtn = page.getByRole('button', { name: /desbloquear/i });
    await unlockBtn.waitFor({ state: 'visible', timeout: 10000 });
    await unlockBtn.click({ timeout: 15000 });
  } else {
    // Onboarding: 2 inputs (PIN + confirmación).
    await passwordInput.nth(0).fill(TEST_PIN, { timeout: 15000 });
    await passwordInput.nth(1).fill(TEST_PIN, { timeout: 15000 });
    await page.getByRole('button', { name: /crear pin|continuar/i }).click({ timeout: 15000 });
  }
}

