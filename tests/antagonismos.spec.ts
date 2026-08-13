import { test, expect } from '@playwright/test';

/**
 * Tests E2E - Sistema de Alertas de Antagonismos
 */

// Helper para autenticarse rápidamente
async function authenticate(page: any) {
  await page.goto('/');

  // Si BYPASS_AUTH está activo, no hay pantalla de login — continuar directamente
  const passwordInput = page.locator('input[type="password"]');
  const isVisible = await passwordInput.first().isVisible().catch(() => false);
  if (!isVisible) return;

  await passwordInput.first().fill('test123');
  const inputs = page.locator('input[type="password"]');
  if (await inputs.count() >= 2) {
    await inputs.nth(1).fill('test123');
  }
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(2000);
}

test.describe('Sistema de Antagonismos', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await authenticate(page);
  });

  test('debería mostrar badge de alertas cuando hay antagonismos', async ({ page }) => {
    // Buscar productos con principios activos conocidos
    const searchInput = page.getByPlaceholder(/buscar/i).or(page.getByRole('searchbox'));
    await searchInput.waitFor({ state: 'visible', timeout: 10000 });
    
    // Buscar un producto con warfarina (antagonismo conocido con Ginkgo)
    await searchInput.fill('warfarina');
    await page.waitForTimeout(1000);
    
    // Agregar primer producto a la bandeja
    const firstResult = page.locator('button:has-text("Añadir")').first();
    if (await firstResult.isVisible()) {
      await firstResult.click();
      await page.waitForTimeout(500);
    }
    
    // Buscar un producto con Ginkgo (antagonismo conocido)
    await searchInput.fill('ginkgo');
    await page.waitForTimeout(1000);
    
    // Agregar segundo producto
    const addButton = page.locator('button:has-text("Añadir")').first();
    if (await addButton.isVisible()) {
      await addButton.click();
      await page.waitForTimeout(500);
    }
    
    // Verificar que aparece el FloatingTray con indicador de alerta
    const floatingTray = page.locator('text=/\\d+\\s*alerta/i');
    await expect(floatingTray.or(page.locator('[class*="bg-red"]'))).toBeVisible({ timeout: 5000 });
  });

  test('debería abrir modal de análisis con 2+ productos', async ({ page }) => {
    // Agregar productos a la bandeja
    const searchInput = page.getByPlaceholder(/buscar/i).or(page.getByRole('searchbox'));
    await searchInput.waitFor({ state: 'visible', timeout: 10000 });
    
    // Producto 1
    await searchInput.fill('vitamina c');
    await page.waitForTimeout(1000);
    const add1 = page.locator('button:has-text("Añadir")').first();
    if (await add1.isVisible()) await add1.click();
    await page.waitForTimeout(500);
    
    // Producto 2
    await searchInput.fill('hierro');
    await page.waitForTimeout(1000);
    const add2 = page.locator('button:has-text("Añadir")').first();
    if (await add2.isVisible()) await add2.click();
    await page.waitForTimeout(500);
    
    // Buscar botón de analizar
    const analyzeButton = page.locator('button:has-text("Analizar")');
    await expect(analyzeButton).toBeVisible({ timeout: 5000 });
    
    // Click en analizar
    await analyzeButton.click();
    await page.waitForTimeout(1000);
    
    // Verificar que se abre el modal de análisis
    const analysisModal = page.locator('text=/Análisis Cruzado/i');
    await expect(analysisModal).toBeVisible({ timeout: 5000 });
  });

  test('debería mostrar sección de alertas de KB en el modal', async ({ page }) => {
    // Navegar directamente al modal con productos de antagonismo
    await page.goto('/');
    await authenticate(page);
    
    // Buscar productos con principios activos antagonistas
    const searchInput = page.getByPlaceholder(/buscar/i).or(page.getByRole('searchbox'));
    await searchInput.waitFor({ state: 'visible', timeout: 10000 });
    
    // Agregar dos productos con posible antagonismo
    await searchInput.fill('omega 3');
    await page.waitForTimeout(1000);
    const add1 = page.locator('button:has-text("Añadir")').first();
    if (await add1.isVisible()) await add1.click();
    await page.waitForTimeout(500);
    
    await searchInput.fill('vitamina e');
    await page.waitForTimeout(1000);
    const add2 = page.locator('button:has-text("Añadir")').first();
    if (await add2.isVisible()) await add2.click();
    await page.waitForTimeout(500);
    
    // Abrir análisis
    const analyzeButton = page.locator('button:has-text("Analizar")');
    if (await analyzeButton.isVisible()) {
      await analyzeButton.click();
      await page.waitForTimeout(2000);
      
      // Verificar que el modal muestra la sección de alertas de KB o el reporte de IA
      const modalContent = page.locator('text=/Reporte de Seguridad IA|Alertas de Base de Conocimiento/i');
      await expect(modalContent.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('debería abrir panel de búsqueda semántica', async ({ page }) => {
    // Esperar a que cargue la página
    await page.waitForTimeout(2000);
    
    // Buscar botón de búsqueda semántica (en el SearchModule)
    const semanticButton = page.locator('button:has-text("Búsqueda Semántica")');
    
    if (await semanticButton.isVisible()) {
      await semanticButton.click();
      await page.waitForTimeout(1000);
      
      // Verificar que se abre el panel
      const panel = page.locator('text=/Búsqueda Semántica/i');
      await expect(panel.first()).toBeVisible({ timeout: 5000 });
      
      // Escribir una búsqueda
      const input = page.getByPlaceholder(/suplemento para dormir/i);
      if (await input.isVisible()) {
        await input.fill('ansiedad');
        await page.waitForTimeout(1000);
        
        // Verificar que hay resultados
        const results = page.locator('text=/similitud/i');
        await expect(results.first()).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('debería cerrar panel con Escape', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Abrir panel de búsqueda semántica
    const semanticButton = page.locator('button:has-text("Búsqueda Semántica")');
    if (await semanticButton.isVisible()) {
      await semanticButton.click();
      await page.waitForTimeout(500);
      
      // Cerrar con Escape
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
      
      // Verificar que se cerró
      const panel = page.locator('text=/Encuentra ingredientes similares/i');
      await expect(panel).not.toBeVisible();
    }
  });
});
