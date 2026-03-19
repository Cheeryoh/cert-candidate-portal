import { test, expect } from '@playwright/test'

// Credentials are read from .env.local (TEST_EMAIL / TEST_PASS).
// Set TEST_PASS to the same value as SEED_PASSWORD before running tests.
const SEED_EMAIL = process.env.TEST_EMAIL ?? 'alice@example.com'
const SEED_PASS  = process.env.TEST_PASS  ?? ''

test.describe('Auth flow', () => {
  test('login page renders correctly', async ({ page }) => {
    await page.goto('/login')
    // Brand name is controlled by NEXT_PUBLIC_BRAND_NAME env var (default: ANTHROP\C)
    const brandName = process.env.NEXT_PUBLIC_BRAND_NAME ?? 'ANTHROP\\C'
    await expect(page.getByText(brandName)).toBeVisible()
    await expect(page.getByText('Certification Portal')).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })

  test('redirects unauthenticated users from /dashboard to /login', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/)
  })

  test('shows error on invalid credentials', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/email/i).fill('wrong@example.com')
    await page.getByLabel(/password/i).fill('wrongpassword')
    await page.getByRole('button', { name: /sign in/i }).click()
    // Sonner toast or inline error should appear
    await expect(page.getByText(/invalid|credentials|error/i)).toBeVisible({ timeout: 5000 })
  })

  test('successful login redirects to dashboard', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/email/i).fill(SEED_EMAIL)
    await page.getByLabel(/password/i).fill(SEED_PASS)
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })
  })

  test('authenticated user visiting /login is redirected to dashboard', async ({ page }) => {
    // Log in first
    await page.goto('/login')
    await page.getByLabel(/email/i).fill(SEED_EMAIL)
    await page.getByLabel(/password/i).fill(SEED_PASS)
    await page.getByRole('button', { name: /sign in/i }).click()
    await page.waitForURL(/\/dashboard/)

    // Now try to visit /login again
    await page.goto('/login')
    await expect(page).toHaveURL(/\/dashboard/)
  })
})
