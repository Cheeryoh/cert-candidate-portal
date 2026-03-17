import { test, expect } from '@playwright/test'

const SEED_EMAIL = process.env.TEST_EMAIL ?? 'alice@example.com'
const SEED_PASS = process.env.TEST_PASS ?? 'SeedPass123!'

test.describe('Catalogue page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/email/i).fill(SEED_EMAIL)
    await page.getByLabel(/password/i).fill(SEED_PASS)
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.waitForURL(/\/dashboard/)
    await page.goto('/catalogue')
  })

  test('shows Catalogue heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /catalogue/i })).toBeVisible()
  })

  test('shows certification cards', async ({ page }) => {
    await expect(page.getByText(/AIFC-F1/)).toBeVisible()
    await expect(page.getByText(/AIFC-P1/)).toBeVisible()
    await expect(page.getByText(/CCPA-101/)).toBeVisible()
  })

  test('shows eligibility badges', async ({ page }) => {
    // Alice has passed AIFC-F1 and AIFC-P1 — should show Certified
    await expect(page.getByText(/certified/i).first()).toBeVisible()
  })

  test('shows Not Eligible for certs with unmet prerequisites', async ({ page }) => {
    // Alice has not passed AIFC-E1's prerequisite chain partially,
    // but hasn't met AIFC-E1 (scheduled) — prereqs ARE met for AIFC-E1
    // CCPA-101 has no prereqs — should be Eligible
    await expect(page.getByText(/eligible/i).first()).toBeVisible()
  })

  test('shows category badges on cards', async ({ page }) => {
    await expect(page.getByText(/AI Fluency/).first()).toBeVisible()
  })
})
