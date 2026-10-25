import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser', fullyParallel: false, workers: 1, timeout: 60000,
  use: { baseURL: 'http://127.0.0.1:5174', channel: 'chrome', viewport: { width: 1280, height: 1000 }, screenshot: 'only-on-failure' },
  projects: [{ name: 'desktop' }, { name: 'touch', use: { ...devices['Pixel 7'], defaultBrowserType: 'chromium', channel: 'chrome' } }],
  webServer: { command: 'npm run dev -- --host 127.0.0.1 --port 5174 --strictPort', url: 'http://127.0.0.1:5174', reuseExistingServer: true },
});
