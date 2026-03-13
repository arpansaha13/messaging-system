import type { BrowserContext, Page } from '@playwright/test'
import { test, expect } from '../../fixtures/base.fixture'
import { createAuthenticatedContext } from '../../helpers/session'

test.describe('Authentication — Logout', () => {
  let aliceContext: BrowserContext
  let alicePage: Page

  test.beforeAll(async ({ browser }) => {
    aliceContext = await createAuthenticatedContext(browser, 'alice')
  })

  test.afterAll(async () => {
    await aliceContext?.close()
  })

  test.beforeEach(async () => {
    alicePage = await aliceContext.newPage()
  })

  test.afterEach(async () => {
    await alicePage?.close()
  })

  test('LO-01 logout clears session and redirects to login', async () => {
    await alicePage.goto('/')
    await expect(alicePage).toHaveURL('/')

    // Trigger logout — the logout button is in the Navbar settings/profile area
    // The app calls POST /api/auth/logout internally; trigger it via request
    await alicePage.request.post('/api/auth/logout')

    // Navigate to home — should be redirected to login now that session is gone
    await alicePage.goto('/')
    await expect(alicePage).toHaveURL('/auth/login', { timeout: 10_000 })
  })
})
