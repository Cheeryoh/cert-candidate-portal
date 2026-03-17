import { test, expect } from '@playwright/test'

const SEED_EMAIL = process.env.TEST_EMAIL ?? 'alice@example.com'
const SEED_PASS = process.env.TEST_PASS ?? 'SeedPass123!'

test.describe('Dashboard page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/email/i).fill(SEED_EMAIL)
    await page.getByLabel(/password/i).fill(SEED_PASS)
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.waitForURL(/\/dashboard/)
  })

  test('shows Dashboard heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()
  })

  test('renders profile card with name', async ({ page }) => {
    // Alice Anderson's initials or name should be visible
    await expect(page.getByText(/alice/i)).toBeVisible()
  })

  test('renders 4 stat cards', async ({ page }) => {
    await expect(page.getByText(/active certs/i)).toBeVisible()
    await expect(page.getByText(/passed/i)).toBeVisible()
    await expect(page.getByText(/failed/i)).toBeVisible()
    await expect(page.getByText(/scheduled/i)).toBeVisible()
  })

  test('has links to History and Catalogue', async ({ page }) => {
    await expect(page.getByRole('link', { name: /history/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /catalogue/i })).toBeVisible()
  })
})
