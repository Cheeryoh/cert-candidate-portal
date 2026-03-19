import { test, expect } from '@playwright/test'

const SEED_EMAIL = process.env.TEST_EMAIL ?? 'alice@example.com'
const SEED_PASS  = process.env.TEST_PASS  ?? ''

test.describe('Exam flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/email/i).fill(SEED_EMAIL)
    await page.getByLabel(/password/i).fill(SEED_PASS)
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.waitForURL(/\/dashboard/)
  })

  test('full exam flow: register → take exam → submit → history', async ({ page }) => {
    // Navigate to catalogue
    await page.goto('/catalogue')
    await expect(page.getByRole('heading', { name: /catalogue/i })).toBeVisible()

    // Find the AIFC-F1 card and click Register & Start Exam
    const aifc1Card = page.locator('text=AIFC-F1').first().locator('../..')
    const startButton = aifc1Card.getByRole('button', { name: /register & start exam/i })
    await startButton.click()

    // Should redirect to /exam/<uuid>
    await page.waitForURL(/\/exam\/[0-9a-f-]+/, { timeout: 15000 })
    expect(page.url()).toMatch(/\/exam\/[0-9a-f-]+/)

    // Exam page should show the cert name
    await expect(page.getByText(/AI Fluency/i)).toBeVisible()

    // Submit the exam
    await page.getByRole('button', { name: /submit exam/i }).click()

    // Should redirect to /history
    await page.waitForURL(/\/history/, { timeout: 15000 })
    await expect(page).toHaveURL(/\/history/)

    // History table should show a row with passed or failed status
    await expect(page.getByRole('heading', { name: /history/i })).toBeVisible()
    const statusCell = page.getByRole('cell', { name: /passed|failed/i }).first()
    await expect(statusCell).toBeVisible({ timeout: 10000 })
  })

  test('exam page redirects to history for non-existent attempt', async ({ page }) => {
    await page.goto('/exam/00000000-0000-0000-0000-000000000000')
    await page.waitForURL(/\/history/, { timeout: 10000 })
    await expect(page).toHaveURL(/\/history/)
  })
})
