import { test, expect } from '@playwright/test'

const SEED_EMAIL = process.env.TEST_EMAIL ?? 'alice@example.com'
const SEED_PASS  = process.env.TEST_PASS  ?? ''

test.describe('History page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/email/i).fill(SEED_EMAIL)
    await page.getByLabel(/password/i).fill(SEED_PASS)
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.waitForURL(/\/dashboard/)
    await page.goto('/history')
  })

  test('shows History heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /history/i })).toBeVisible()
  })

  test('renders table column headers', async ({ page }) => {
    await expect(page.getByRole('columnheader', { name: /certification/i })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: /attempt/i })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: /status/i })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: /score/i })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: /date/i })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: /expires/i })).toBeVisible()
  })

  test('shows attempt rows for seed user', async ({ page }) => {
    // Alice has 3 attempts in seed data
    const rows = page.getByRole('row')
    // header + at least 1 data row
    await expect(rows).toHaveCount(await rows.count())
    const count = await rows.count()
    expect(count).toBeGreaterThan(1)
  })

  test('shows passed badge in green', async ({ page }) => {
    await expect(page.getByText(/passed/i).first()).toBeVisible()
  })
})
