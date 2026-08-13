import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  // Solo ejecutar archivos .spec.ts (E2E), no los .test.ts (unitarios de vitest)
  // que dependen de import.meta.env y fallan fuera del entorno de Vite.
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'off',
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 60000,
  },
});
