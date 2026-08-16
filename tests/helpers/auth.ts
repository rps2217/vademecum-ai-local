import type { Page } from '@playwright/test';

/**
 * Helper compartido de autenticación para los tests E2E.
 *
 * Maneja los dos flujos de la app:
 *  - Onboarding (primera vez, sin keypair en localStorage): pide contraseña +
 *    confirmación, genera el keypair (PBKDF2 600k iteraciones) y muestra la
 *    frase de recuperación antes de entrar a la app.
 *  - Login (keypair ya existe, sesión expirada): pide solo la contraseña para
 *    desbloquear.
 *
 * El keypair cifrado se guarda en `localStorage` (`vademecum_keypair`); el
 * flag de sesión en `sessionStorage`. Por eso, para forzar re-unlock entre
 * tests basta con limpiar `sessionStorage` (ver `resetSession`); para forzar
 * onboarding desde cero hay que limpiar también `localStorage` (ver
 * `resetAll`).
 */

export const TEST_PASSWORD = 'Test1234!';

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
  await page.goto('/');

  // ¿Ya estamos dentro de la app? (sesión activa)
  const searchInput = page
    .getByPlaceholder(/buscar/i)
    .or(page.getByRole('searchbox'));
  const alreadyIn = await searchInput
    .first()
    .isVisible({ timeout: 2000 })
    .catch(() => false);
  if (alreadyIn) return;

  await unlockInPlace(page);

  // Confirmar que la app cargó (input de búsqueda visible).
  await searchInput.first().waitFor({ state: 'visible', timeout: 15000 });
}

/**
 * Desbloquea la sesión SI la página actual es el login (o completa el
 * onboarding si no hay cuenta). A diferencia de `authenticate`, NO navega a
 * '/' — se usa tras un `page.goto('/ruta-protegida')` que, al recargar la app,
 * reinicia `isAuthenticated` (el provider exige re-unlock en cada boot) y
 * redirige a `/login`. Tras el desbloqueo, el usuario vuelve a la ruta
 * protegida original.
 */
export async function ensureAuthenticated(page: Page): Promise<void> {
  // ¿Ya dentro de la app? Nada que hacer.
  const searchInput = page
    .getByPlaceholder(/buscar/i)
    .or(page.getByRole('searchbox'));
  const alreadyIn = await searchInput
    .first()
    .isVisible({ timeout: 1500 })
    .catch(() => false);
  if (alreadyIn) return;

  // Si estamos en onboarding o login, resolver el flujo in-place.
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
 * a una ruta concreta. Tras onboarding queda en la app; tras login, el
 * ProtectedRoute/AuthRoute redirige a la ruta destino.
 */
async function unlockInPlace(page: Page): Promise<void> {
  const passwordInput = page.locator('input[type="password"]');
  await passwordInput.first().waitFor({ state: 'visible', timeout: 15000 });

  const unlockBtn = page.locator('button[type="submit"]', {
    hasText: /desbloquear/i,
  });
  const isLogin = await unlockBtn
    .isVisible({ timeout: 2000 })
    .catch(() => false);

  if (isLogin) {
    await passwordInput.first().fill(TEST_PASSWORD, { timeout: 15000 });
    await unlockBtn.click({ timeout: 15000 });
  } else {
    // Onboarding: contraseña + confirmación.
    await passwordInput.nth(0).fill(TEST_PASSWORD, { timeout: 15000 });
    await passwordInput.nth(1).fill(TEST_PASSWORD, { timeout: 15000 });
    await page.locator('button[type="submit"]').click({ timeout: 15000 });

    // La generación del keypair (PBKDF2 600k) puede tardar varios segundos
    // en runners de CI lentos. Esperar a que aparezca el botón "Completar
    // configuración" con un timeout generoso, en vez de un sleep fijo.
    const completeBtn = page.locator('button', { hasText: /completar/i });
    await completeBtn.waitFor({ state: 'visible', timeout: 30000 });
    await completeBtn.click();
  }
}
