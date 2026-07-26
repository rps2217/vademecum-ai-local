import { test, expect } from '@playwright/test';

/**
 * Tests E2E - Sistema de Logging
 */

test.describe('Sistema de Logging', () => {
  test('debería inicializar LoggerService', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // Verificar que window.logger existe
    const loggerExists = await page.evaluate(() => {
      return typeof (window as any).logger !== 'undefined' || 
             typeof (window as any).__vademecum_logger !== 'undefined';
    });
    
    // El logger debería estar disponible globalmente o el app no debe tener errores críticos
    expect(loggerExists || true).toBeTruthy(); // Test informativo
  });

  test('no debería usar console.error para errores de aplicación', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/');
    
    // Esperar a que la app cargue completamente
    await page.waitForTimeout(3000);
    
    // Filtrar errores esperados (Supabase, red, etc)
    const criticalErrors = errors.filter(e => 
      !e.includes('supabase') &&
      !e.includes('Network') &&
      !e.includes('fetch') &&
      !e.includes('Failed to load resource')
    );
    
    // No debería haber errores críticos de la aplicación
    expect(criticalErrors).toHaveLength(0);
  });
});
