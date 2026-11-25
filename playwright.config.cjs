const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.cjs',
  timeout: 120000,
  workers: 1,
  use: { baseURL: 'http://127.0.0.1:4173', channel: process.env.TGI_BROWSER || 'chrome', viewport: { width: 390, height: 844 }, screenshot: 'only-on-failure' },
  webServer: { command: 'npm run preview', url: 'http://127.0.0.1:4173', reuseExistingServer: !process.env.CI },
  reporter: 'list'
});
