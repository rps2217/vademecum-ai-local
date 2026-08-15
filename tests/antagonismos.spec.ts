import { test, expect } from '@playwright/test';
import { authenticate, resetSession } from './helpers/auth';

/**
 * Tests E2E - Checker de interacciones (AnalysisPage)
 *
 * El farmacéutico selecciona 2-5 ingredientes y obtiene sinergias,
 * antagonismos, alertas de perfil de cliente y pares sin datos.
 *
 * Nota: navegamos a /analysis vía el link de la app (navegación SPA) en vez
 * de `page.goto('/analysis')` porque un `goto` recarga la app y el provider
 * E2EE exige re-unlock en cada boot (isAuthenticated se reinicia), lo que
 * redirigiría a /login.
 */

test.describe('AnalysisPage - Checker de interacciones', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await resetSession(page);
    await page.reload();
    await authenticate(page);
  });

  /** Navega a /analysis vía el link SPA "Análisis" del AppShell. */
  async function goToAnalysis(page: import('@playwright/test').Page) {
    const navLink = page.getByRole('link', { name: /^análisis$/i });
    await navLink.first().click();
    await page.waitForTimeout(800);
  }

  test('debería mostrar la página de análisis con selector de ingredientes', async ({ page }) => {
    await goToAnalysis(page);

    await expect(page.getByRole('heading', { name: /análisis de interacciones/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/selecciona 2 a 5 ingredientes/i)).toBeVisible();
  });

  test('debería buscar y añadir ingredientes al análisis', async ({ page }) => {
    await goToAnalysis(page);

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
    await goToAnalysis(page);

    const searchInput = page.locator('input[placeholder*="Buscar ingrediente"]');

    await searchInput.fill('valeriana');
    await page.waitForTimeout(1000);
    await page.locator('button:has-text("valeriana")').first().click();
    await page.waitForTimeout(500);

    await searchInput.fill('pasiflora');
    await page.waitForTimeout(1000);
    await page.locator('button:has-text("pasiflora")').first().click();
    await page.waitForTimeout(1000);

    // El heading de resultados "Sinergias beneficiosas" (distinto del link de
    // navegación "Sinergias").
    await expect(page.getByRole('heading', { name: /sinergias beneficiosas/i })).toBeVisible({ timeout: 5000 });
  });
});
