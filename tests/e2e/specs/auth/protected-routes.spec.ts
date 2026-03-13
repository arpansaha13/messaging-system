import { test, expect } from '../../fixtures/base.fixture'

const PROTECTED_ROUTES = ['/', '/contacts', '/search', '/archived', '/settings/profile']

test.describe('Protected Routes', () => {
  test('PR-01 unauthenticated access to / redirects to login', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL('/auth/login', { timeout: 10_000 })
  })

  for (const route of PROTECTED_ROUTES) {
    test(`PR-02 unauthenticated access to ${route} redirects to login`, async ({ page }) => {
      await page.goto(route)
      await expect(page).toHaveURL('/auth/login', { timeout: 10_000 })
    })
  }

  test('PR-03 expired/invalid session cookie redirects to login', async ({ browser }) => {
    const ctx = await browser.newContext()
    await ctx.addCookies([
      {
        name: 'session',
        value: 'invalid-malformed-token',
        domain: 'localhost',
        path: '/',
      },
    ])
    const page = await ctx.newPage()
    await page.goto('/')
    await expect(page).toHaveURL('/auth/login', { timeout: 10_000 })
    await ctx.close()
  })
})
