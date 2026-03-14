import type { BrowserContext, Page } from '@playwright/test'
import { test, expect } from '../../fixtures/base.fixture'
import { waitForHydration } from '../../helpers/hydration'
import { createAuthenticatedContext } from '../../helpers/session'

test.describe('Groups — Create Channel', () => {
  let aliceContext: BrowserContext
  let bobContext: BrowserContext
  let alicePage: Page
  let bobPage: Page

  test.beforeAll(async ({ browser }) => {
    aliceContext = await createAuthenticatedContext(browser, 'alice')
    bobContext = await createAuthenticatedContext(browser, 'bob')
  })

  test.afterAll(async () => {
    await aliceContext?.close()
    await bobContext?.close()
  })

  test.afterEach(async () => {
    await alicePage?.close()
    await bobPage?.close()
  })

  test('CH-01 founder can create a channel in their group', async () => {
    alicePage = await aliceContext.newPage()

    // Create group via API
    const groupRes = await alicePage.request.post('/api/groups', {
      data: { name: `ChGroup-${Date.now()}` },
    })
    if (!groupRes.ok()) {
      throw new Error(`Failed to create group (${groupRes.status()}): ${await groupRes.text()}`)
    }
    const group = (await groupRes.json()) as { id: number | string; name: string }

    await alicePage.goto(`/groups/${group.id}`)
    await waitForHydration(alicePage)

    // Find the create channel button/form on the group page
    await alicePage.getByRole('button', { name: /create new channel/i }).click()

    // Fill channel name
    const channelInput = alicePage.getByPlaceholder(/enter channel name/i)
    await channelInput.fill('general')
    await alicePage.getByRole('button', { name: /create channel/i }).click()

    await expect(alicePage.getByText('general')).toBeVisible({ timeout: 10_000 })

    // Verify channel persists on reload
    await alicePage.reload()
    await waitForHydration(alicePage)
    await expect(alicePage.getByText('general')).toBeVisible()
  })

  test('CH-02 non-founder cannot create a channel', async () => {
    alicePage = await aliceContext.newPage()
    bobPage = await bobContext.newPage()

    // Alice creates group, Bob joins via invite
    const groupRes = await alicePage.request.post('/api/groups', {
      data: { name: `ChGroup2-${Date.now()}` },
    })
    if (!groupRes.ok()) {
      throw new Error(`Failed to create group (${groupRes.status()}): ${await groupRes.text()}`)
    }
    const group = (await groupRes.json()) as { id: number | string; name: string }

    const inviteRes = await alicePage.request.post(`/api/groups/${group.id}/invites`)
    if (!inviteRes.ok()) {
      throw new Error(`Failed to create invite (${inviteRes.status()}): ${await inviteRes.text()}`)
    }
    const invite = (await inviteRes.json()) as { hash: string }
    if (!invite.hash) {
      throw new Error('Invite hash missing from response')
    }

    await bobPage.goto(`/invites/${invite.hash}`)
    await waitForHydration(bobPage)
    const joinButton = bobPage.getByRole('button', { name: /accept|join/i })
    await expect(joinButton).toBeVisible({ timeout: 10_000 })
    await joinButton.click()
    await expect(bobPage.getByText(group.name)).toBeVisible({ timeout: 10_000 })

    // Bob navigates to the group and tries to create a channel
    await bobPage.goto(`/groups/${group.id}`)
    await waitForHydration(bobPage)

    // The create channel button should not be visible or should be disabled for non-founders
    const createBtn = bobPage.getByRole('button', { name: /create new channel/i })
    const isVisible = await createBtn.isVisible()

    // If not implemented: this test documents the expected behavior
    if (isVisible) {
      await createBtn.click()
      // Should show an error or be blocked
      await expect(bobPage.getByText(/not allowed|permission|forbidden/i)).toBeVisible({
        timeout: 5_000,
      })
    } else {
      expect(isVisible).toBe(false)
    }
  })
})
