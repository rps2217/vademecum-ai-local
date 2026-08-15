import { test, expect } from '@playwright/test';
import { authenticate, resetSession } from './helpers/auth';

/**
 * Tests E2E - Navegación y UI
 */

test.describe('Navegación y UI', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await resetSession(page);
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

      // La pestaña "Cuenta" contiene la gestión de contraseña/clave.
      // (La pestaña por defecto es "Apariencia", que no menciona contraseña.)
      const accountTab = page.locator('button', { hasText: /^cuenta$/i });
      if (await accountTab.isVisible().catch(() => false)) {
        await accountTab.click();
        await page.waitForTimeout(500);
      }

      // Verificar que se abrió algo relacionado con settings
      const settingsContent = page.locator('text=/seguridad|security|password|contraseña|clave|cuenta/i');
      await expect(settingsContent.first()).toBeVisible({ timeout: 5000 });
    }
  });
});
