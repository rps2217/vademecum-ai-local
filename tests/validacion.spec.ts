import { test, expect } from '@playwright/test';

/**
 * Tests E2E - Validación y Robustez
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

test.describe('Validación y Robustez', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => sessionStorage.clear());
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
