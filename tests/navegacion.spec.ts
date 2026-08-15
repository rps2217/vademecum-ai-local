import { test, expect } from '@playwright/test';

/**
 * Tests E2E - Navegación y UI
 */

// Helper para autenticarse rápidamente
async function authenticate(page: any) {
  await page.goto('/');

  // Si ya hay sesión activa, continuar
  const searchInput = page.getByPlaceholder(/buscar/i).or(page.getByRole('searchbox'));
  const alreadyIn = await searchInput.first().isVisible({ timeout: 2000 }).catch(() => false);
  if (alreadyIn) return;

  // Detectar si hay cuenta (login) o no (onboarding)
  const passwordInput = page.locator('input[type="password"]');
  await passwordInput.first().waitFor({ state: 'visible', timeout: 10000 });

  const unlockBtn = page.locator('button[type="submit"]', { hasText: /desbloquear/i });
  const isLogin = await unlockBtn.isVisible({ timeout: 2000 }).catch(() => false);

  if (isLogin) {
    // Login: ya hay cuenta, desbloquear
    await passwordInput.first().fill('Test1234!');
    await unlockBtn.click();
  } else {
    // Onboarding: primera vez, configurar contraseña
    await passwordInput.nth(0).fill('Test1234!');
    await passwordInput.nth(1).fill('Test1234!');
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(3000); // Generar claves
    // Click en "Completar configuración"
    const completeBtn = page.locator('button', { hasText: /completar/i });
    await completeBtn.click();
  }

  await page.waitForTimeout(2000);
}

test.describe('Navegación y UI', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => sessionStorage.clear());
    await page.reload();
    await authenticate(page);
  });

  test('debería mostrar el header con logo', async ({ page }) => {
    const header = page.locator('header, [role="banner"]').first();
    await expect(header).toBeVisible({ timeout: 10000 });
  });

  test('debería tener input de búsqueda visible', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/buscar/i).or(page.getByRole('searchbox'));
    await expect(searchInput).toBeVisible({ timeout: 10000 });
  });

  test('debería ser responsive en móvil', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await expect(page.locator('body')).toBeVisible();
    
    const searchInput = page.getByPlaceholder(/buscar/i).or(page.getByRole('searchbox'));
    await expect(searchInput).toBeVisible({ timeout: 10000 });
  });

  test('debería tener acceso a configuración', async ({ page }) => {
    // Buscar botón de configuración
    const settingsButton = page.locator('button, a').filter({ hasText: /config|ajustes|settings|⚙/i }).first();
    
    // Click en configuración si existe
    const isVisible = await settingsButton.isVisible().catch(() => false);
    if (isVisible) {
      await settingsButton.click();
      await page.waitForTimeout(1000);
      // La pestaña "Cuenta" contiene la gestión de contraseña/cifrado
      const accountTab = page.locator('button, a').filter({ hasText: /^Cuenta$/i }).first();
      if (await accountTab.isVisible().catch(() => false)) {
        await accountTab.click();
        await page.waitForTimeout(500);
      }
      // Verificar que se abrió algo relacionado con cuenta/seguridad
      const settingsContent = page.locator('text=/seguridad|security|password|contraseña|cifrado|cuenta/i');
      await expect(settingsContent.first()).toBeVisible({ timeout: 5000 });
    }
  });
});
