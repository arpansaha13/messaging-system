import type { BrowserContext, Page } from '@playwright/test'
import { test, expect } from '../../fixtures/base.fixture'
import { createAuthenticatedContext } from '../../helpers/session'
import { waitForHydration } from '../../helpers/hydration'

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
    await alicePage.goto('/settings/profile')
    await waitForHydration(alicePage)

    // Trigger logout via UI (settings sidebar)
    await alicePage.getByText('Log out').click()

    // Navigate to home — should be redirected to login now that session is gone
    await alicePage.goto('/')
    await expect(alicePage).toHaveURL('/auth/login', { timeout: 10_000 })

    // Verify logged-out state persists on reload
    await alicePage.reload()
    await expect(alicePage).toHaveURL('/auth/login', { timeout: 10_000 })
  })
})
