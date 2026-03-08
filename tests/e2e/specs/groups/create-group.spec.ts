import { test, expect } from '../../fixtures/auth.fixture'
import { waitForHydration } from '../../helpers/hydration'

test.describe('Groups — Create Group', () => {
  test('G-01 create group shows it in navbar group list', async ({ alicePage }) => {
    await alicePage.goto('/')
    await waitForHydration(alicePage)

    // Open the Create Group modal — button has sr-only text "Create new group"
    await alicePage.getByRole('button', { name: /create new group/i }).first().click()

    const groupName = `TestGroup-${Date.now()}`
    await alicePage.getByTestId('group-name-input').fill(groupName)
    await alicePage.getByTestId('create-group-btn').click()

    // New group appears in the navbar
    await expect(alicePage.getByText(groupName)).toBeVisible({ timeout: 10_000 })
  })

  test('G-02 empty group name does not create a group', async ({ alicePage }) => {
    await alicePage.goto('/')
    await waitForHydration(alicePage)

    await alicePage.getByRole('button', { name: /create new group/i }).first().click()

    // Leave input blank and click Create
    await alicePage.getByTestId('create-group-btn').click()

    // Modal should still be open (group was not created — handleCreateGroup guards on empty name)
    await expect(alicePage.getByTestId('group-name-input')).toBeVisible()
  })
})
