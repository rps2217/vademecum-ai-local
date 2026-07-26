import { test, expect } from '@playwright/test';

/**
 * Tests E2E - Navegación y UI
 */

test.describe('Navegación y UI', () => {
  test('debería mostrar el header con logo', async ({ page }) => {
    await page.goto('/');
    
    // Verificar que hay un elemento header
    const header = page.locator('header, [role="banner"]').first();
    await expect(header).toBeVisible({ timeout: 10000 });
  });

  test('debería tener input de búsqueda visible', async ({ page }) => {
    await page.goto('/');
    
    const searchInput = page.getByPlaceholder(/buscar/i).or(page.getByRole('searchbox'));
    await expect(searchInput).toBeVisible({ timeout: 10000 });
  });

  test('no debería mostrar errores en consola', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForTimeout(3000); // Esperar que cargue
    
    // Filtrar errores conocidos que no son críticos
    const criticalErrors = errors.filter(e => 
      !e.includes('favicon') && 
      !e.includes('404') &&
      !e.includes('supabase') // Supabase puede no estar configurado
    );
    
    expect(criticalErrors).toHaveLength(0);
  });

  test('debería ser responsive', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.goto('/');
    
    // Verificar que la página no crashea
    await expect(page.locator('body')).toBeVisible();
    
    // Verificar que el search input sigue visible
    const searchInput = page.getByPlaceholder(/buscar/i).or(page.getByRole('searchbox'));
    await expect(searchInput).toBeVisible({ timeout: 10000 });
  });
});
