import { test, expect } from '../../fixtures/base.fixture'
import { waitForHydration } from '../../helpers/hydration'

// Uses a unique email per run to avoid conflicts with global-setup test users
function uniqueEmail(prefix: string) {
  return `${prefix}+${Date.now()}@test.local`
}

test.describe('Authentication — Signup', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/signup')
    await waitForHydration(page)
    await expect(page.getByTestId('signup-form')).toBeVisible()
  })

  test('S-01 complete signup and OTP verification flow', async ({ page }) => {
    const email = uniqueEmail('s01')

    await page.getByPlaceholder('Enter your email').fill(email)
    await page.getByPlaceholder('Enter your name').fill('TestUser')
    await page.getByPlaceholder('Enter your password').fill('TestPass123!')
    await page.getByPlaceholder('Confirm your password').fill('TestPass123!')
    await page.locator('[data-testid="signup-form"] button[type="submit"]').click()

    // Should redirect to verification page
    await expect(page).toHaveURL(/\/auth\/verification\//, { timeout: 10_000 })
    await expect(page.getByTestId('verification-verifying')).toBeVisible()
  })

  test('S-02 signup with existing email shows conflict error', async ({ page }) => {
    await page.getByPlaceholder('Enter your email').fill('alice@test.local')
    await page.getByPlaceholder('Enter your name').fill('AliceDup')
    await page.getByPlaceholder('Enter your password').fill('TestPass123!')
    await page.getByPlaceholder('Confirm your password').fill('TestPass123!')
    await page.locator('[data-testid="signup-form"] button[type="submit"]').click()

    await expect(page.getByText('Sign up failed', { exact: true })).toBeVisible({ timeout: 10_000 })
  })

  test('S-03 passwords do not match shows inline error', async ({ page }) => {
    await page.getByPlaceholder('Enter your email').fill(uniqueEmail('s03'))
    await page.getByPlaceholder('Enter your name').fill('TestUser')
    await page.getByPlaceholder('Enter your password').fill('TestPass123!')
    await page.getByPlaceholder('Confirm your password').fill('DifferentPass!')
    await page.locator('[data-testid="signup-form"] button[type="submit"]').click()

    await expect(page.getByText(/passwords do not match/i)).toBeVisible()
  })

  test('S-04 name exceeding 20 characters shows validation error', async ({ page }) => {
    await page.getByPlaceholder('Enter your name').fill('A'.repeat(21))
    await page.locator('[data-testid="signup-form"] button[type="submit"]').click()

    await expect(page.getByText(/at most 20 characters/i)).toBeVisible()
  })

  test('S-05 wrong OTP code shows error state', async ({ page }) => {
    const email = uniqueEmail('s05')

    await page.getByPlaceholder('Enter your email').fill(email)
    await page.getByPlaceholder('Enter your name').fill('TestUser')
    await page.getByPlaceholder('Enter your password').fill('TestPass123!')
    await page.getByPlaceholder('Confirm your password').fill('TestPass123!')
    await page.locator('[data-testid="signup-form"] button[type="submit"]').click()

    await expect(page).toHaveURL(/\/auth\/verification\//, { timeout: 10_000 })
    await expect(page.getByTestId('verification-verifying')).toBeVisible()

    // Submit a wrong OTP
    await page.getByPlaceholder('Enter the OTP').fill('000000')
    await page.locator('[data-testid="verification-verifying"] button[type="submit"]').click()

    await expect(page.getByTestId('verification-error')).toBeVisible({ timeout: 10_000 })
  })

  test('S-06 expired OTP shows expired state', async ({ page }) => {
    const email = uniqueEmail('s06')

    await page.getByPlaceholder('Enter your email').fill(email)
    await page.getByPlaceholder('Enter your name').fill('TestUser')
    await page.getByPlaceholder('Enter your password').fill('TestPass123!')
    await page.getByPlaceholder('Confirm your password').fill('TestPass123!')
    await page.locator('[data-testid="signup-form"] button[type="submit"]').click()

    await expect(page).toHaveURL(/\/auth\/verification\//, { timeout: 10_000 })

    // OTP_EXPIRY_MINUTES=1 in compose.test.yaml — wait for it to expire (65s)
    // Note: this test is slow by design. Keep timeout generous.
    await page.waitForTimeout(65_000)

    // Submit any valid-format code after expiry
    await page.getByPlaceholder('Enter the OTP').fill('123456')
    await page.locator('[data-testid="verification-verifying"] button[type="submit"]').click()

    await expect(page.getByTestId('verification-expired')).toBeVisible({ timeout: 10_000 })
  })
})
