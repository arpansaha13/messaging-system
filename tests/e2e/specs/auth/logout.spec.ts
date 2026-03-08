import { test, expect } from '../../fixtures/auth.fixture'

test.describe('Authentication — Logout', () => {
  test('LO-01 logout clears session and redirects to login', async ({ alicePage }) => {
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
