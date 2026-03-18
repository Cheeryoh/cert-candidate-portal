import { defineConfig, devices } from '@playwright/test'
import { config as dotenv } from 'dotenv'
import path from 'path'

// Load .env.local so TEST_EMAIL / TEST_PASS are available to test files
// without having to set them as shell variables manually.
dotenv({ path: path.resolve(__dirname, '.env.local') })

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL: 'http://localhost:3001',
    screenshot: 'only-on-failure',
    // Run headless in CI, headed locally for easier debugging
    headless: !!process.env.CI,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
