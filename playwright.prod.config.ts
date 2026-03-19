import { defineConfig, devices } from '@playwright/test'
import { config as dotenv } from 'dotenv'
import path from 'path'

dotenv({ path: path.resolve(__dirname, '.env.local') })

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL: 'https://cert-candidate-portal.vercel.app',
    screenshot: 'only-on-failure',
    headless: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // No webServer — tests run against the live Vercel deployment
})
