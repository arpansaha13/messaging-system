import { test, expect } from '../../fixtures/auth.fixture'
import { waitForHydration } from '../../helpers/hydration'

test.describe('Settings — Profile', () => {
  test.beforeEach(async ({ alicePage }) => {
    await alicePage.goto('/settings/profile')
    await waitForHydration(alicePage)
    await expect(alicePage.getByTestId('profile-form')).toBeVisible()
  })

  test('PR-01 update name saves and persists on reload', async ({ alicePage }) => {
    const newName = `Alice-${Date.now()}`

    await alicePage.getByTestId('profile-name-input').fill(newName)
    await alicePage.getByTestId('profile-save-btn').click()

    await expect(alicePage.getByText(/success|updated/i)).toBeVisible({ timeout: 5_000 })

    await alicePage.reload()
    await waitForHydration(alicePage)
    await expect(alicePage.getByTestId('profile-name-input')).toHaveValue(newName)

    // Restore original name
    await alicePage.getByTestId('profile-name-input').fill('Alice')
    await alicePage.getByTestId('profile-save-btn').click()
  })

  test('PR-02 update bio saves and persists on reload', async ({ alicePage }) => {
    const newBio = `Bio updated at ${Date.now()}`

    await alicePage.getByTestId('profile-bio-textarea').fill(newBio)
    await alicePage.getByTestId('profile-save-btn').click()

    await expect(alicePage.getByText(/success|updated/i)).toBeVisible({ timeout: 5_000 })

    await alicePage.reload()
    await waitForHydration(alicePage)
    await expect(alicePage.getByTestId('profile-bio-textarea')).toHaveValue(newBio)
  })

  test('PR-03 cancel reverts form to saved values', async ({ alicePage }) => {
    const originalName = await alicePage.getByTestId('profile-name-input').inputValue()

    await alicePage.getByTestId('profile-name-input').fill('Temporary Name')
    await alicePage.getByTestId('profile-cancel-btn').click()

    await expect(alicePage.getByTestId('profile-name-input')).toHaveValue(originalName)
  })

  test('PR-04 validation — empty name shows required error', async ({ alicePage }) => {
    await alicePage.getByTestId('profile-name-input').fill('')
    await alicePage.getByTestId('profile-save-btn').click()

    await expect(alicePage.getByText(/required/i)).toBeVisible()
  })
})
