import type { BrowserContext, Page } from '@playwright/test'
import { test, expect } from '../../fixtures/base.fixture'
import { waitForHydration } from '../../helpers/hydration'
import { createAuthenticatedContext } from '../../helpers/session'

test.describe('Settings — Profile', () => {
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
    await alicePage.goto('/settings/profile')
    await waitForHydration(alicePage)
    await expect(alicePage.getByTestId('profile-form')).toBeVisible()
  })

  test.afterEach(async () => {
    await alicePage?.close()
  })

  test('PR-01 update name saves and persists on reload', async () => {
    const newName = `Alice-${Date.now()}`

    await alicePage.getByTestId('profile-name-input').fill(newName)
    await alicePage.getByTestId('profile-save-btn').click()

    await expect(
      alicePage.locator('[data-slot="title"]', { hasText: 'Your profile has been updated successfully.' }),
    ).toBeVisible({ timeout: 5_000 })

    await alicePage.reload()
    await waitForHydration(alicePage)
    await expect(alicePage.getByTestId('profile-name-input')).toHaveValue(newName)

    // Restore original name
    await alicePage.getByTestId('profile-name-input').fill('Alice')
    await alicePage.getByTestId('profile-save-btn').click()
  })

  test('PR-02 update bio saves and persists on reload', async () => {
    const originalBio = await alicePage.getByTestId('profile-bio-textarea').inputValue()
    const newBio = `Bio updated at ${Date.now()}`

    await alicePage.getByTestId('profile-bio-textarea').fill(newBio)
    await alicePage.getByTestId('profile-save-btn').click()

    await expect(
      alicePage.locator('[data-slot="title"]', { hasText: 'Your profile has been updated successfully.' }),
    ).toBeVisible({ timeout: 5_000 })

    await alicePage.reload()
    await waitForHydration(alicePage)
    await expect(alicePage.getByTestId('profile-bio-textarea')).toHaveValue(newBio)

    // Restore original bio
    await alicePage.getByTestId('profile-bio-textarea').fill(originalBio)
    await alicePage.getByTestId('profile-save-btn').click()
  })

  test('PR-03 cancel reverts form to saved values', async () => {
    const originalName = await alicePage.getByTestId('profile-name-input').inputValue()

    await alicePage.getByTestId('profile-name-input').fill('Temporary Name')
    await alicePage.getByTestId('profile-cancel-btn').click()

    await expect(alicePage.getByTestId('profile-name-input')).toHaveValue(originalName)
  })

  test('PR-04 validation — empty name shows required error', async () => {
    await alicePage.getByTestId('profile-name-input').fill('')
    await alicePage.getByTestId('profile-save-btn').click()

    await expect(alicePage.getByText(/required/i)).toBeVisible()
  })
})
