import type { BrowserContext, Page } from '@playwright/test'
import { test, expect } from '../../fixtures/base.fixture'
import { waitForHydration } from '../../helpers/hydration'
import { createAuthenticatedContext } from '../../helpers/session'

test.describe('Groups — Create Group', () => {
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

  test('G-01 create group shows it in navbar group list', async () => {
    await alicePage.goto('/')
    await waitForHydration(alicePage)

    // Open the Create Group modal — button has sr-only text "Create new group"
    await alicePage.getByRole('button', { name: /create new group/i }).first().click()

    const groupName = `TestGroup-${Date.now()}`
    await alicePage.getByTestId('group-name-input').fill(groupName)
    await alicePage.getByTestId('create-group-btn').click()

    // New group appears in the navbar
    await expect(alicePage.getByText(groupName)).toBeVisible({ timeout: 10_000 })

    // Verify group persists on reload
    await alicePage.reload()
    await waitForHydration(alicePage)
    await expect(alicePage.getByText(groupName)).toBeVisible()
  })

  test('G-02 empty group name does not create a group', async () => {
    await alicePage.goto('/')
    await waitForHydration(alicePage)

    await alicePage.getByRole('button', { name: /create new group/i }).first().click()

    // Leave input blank and click Create
    await alicePage.getByTestId('create-group-btn').click()

    // Modal should still be open (group was not created — handleCreateGroup guards on empty name)
    await expect(alicePage.getByTestId('group-name-input')).toBeVisible()
  })
})
