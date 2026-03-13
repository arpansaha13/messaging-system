import { test, expect } from '../../fixtures/base.fixture'
import { waitForHydration } from '../../helpers/hydration'

test.describe('Authentication — Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login')
    await waitForHydration(page)
    await expect(page.getByTestId('login-form')).toBeVisible()
  })

  test('L-01 login with valid credentials redirects to home', async ({ page }) => {
    await page.getByPlaceholder('Enter your email').fill('alice@test.local')
    await page.getByPlaceholder('Enter your password').fill('TestPass123!')
    await page.locator('[data-testid="login-form"] button[type="submit"]').click()

    await expect(page).toHaveURL('/', { timeout: 15_000 })
  })

  test('L-02 login with wrong password shows error', async ({ page }) => {
    await page.getByPlaceholder('Enter your email').fill('alice@test.local')
    await page.getByPlaceholder('Enter your password').fill('WrongPassword!')
    await page.locator('[data-testid="login-form"] button[type="submit"]').click()

    await expect(page.getByText('Login failed', { exact: true })).toBeVisible({ timeout: 10_000 })
    await expect(page).toHaveURL('/auth/login')
  })

  test('L-03 login with unregistered email shows error', async ({ page }) => {
    await page.getByPlaceholder('Enter your email').fill('nobody@test.local')
    await page.getByPlaceholder('Enter your password').fill('TestPass123!')
    await page.locator('[data-testid="login-form"] button[type="submit"]').click()

    await expect(page.getByText('Login failed', { exact: true })).toBeVisible({ timeout: 10_000 })
    await expect(page).toHaveURL('/auth/login')
  })

  test('L-04 login form validation — empty fields', async ({ page }) => {
    await page.locator('[data-testid="login-form"] button[type="submit"]').click()

    // Nuxt UI form validation shows inline errors
    await expect(page.getByText(/required|invalid/i).first()).toBeVisible()
    await expect(page).toHaveURL('/auth/login')
  })

  test('L-05 login form validation — invalid email format', async ({ page }) => {
    await page.getByPlaceholder('Enter your email').fill('notanemail')
    await page.getByPlaceholder('Enter your password').fill('TestPass123!')
    await page.locator('[data-testid="login-form"] button[type="submit"]').click()

    await expect(page.getByText(/invalid email/i)).toBeVisible()
  })

  test('L-06 login form validation — short password', async ({ page }) => {
    await page.getByPlaceholder('Enter your email').fill('alice@test.local')
    await page.getByPlaceholder('Enter your password').fill('short')
    await page.locator('[data-testid="login-form"] button[type="submit"]').click()

    await expect(page.getByText(/at least 8 characters/i)).toBeVisible()
  })
})
