import { test, expect } from '../../fixtures/auth.fixture'
import { waitForHydration } from '../../helpers/hydration'

test.describe('Groups — Create Channel', () => {
  test('CH-01 founder can create a channel in their group', async ({ alicePage }) => {
    // Create group via API
    const groupRes = await alicePage.request.post('/api/groups', {
      data: { name: `ChGroup-${Date.now()}` },
    })
    const group = (await groupRes.json()) as { id: number | string; name: string }

    await alicePage.goto(`/groups/${group.id}`)
    await waitForHydration(alicePage)

    // Find the create channel button/form on the group page
    await alicePage.getByRole('button', { name: /create channel|add channel|\+/i }).first().click()

    // Fill channel name
    const channelInput = alicePage.getByPlaceholder(/channel name|name/i).first()
    await channelInput.fill('general')
    await alicePage.getByRole('button', { name: /create|add/i }).last().click()

    await expect(alicePage.getByText('general')).toBeVisible({ timeout: 10_000 })
  })

  test('CH-02 non-founder cannot create a channel', async ({ alicePage, bobPage }) => {
    const userIdsRes = await alicePage.request.get('/api/users/me')
    const alice = (await userIdsRes.json()) as { id: number }

    // Alice creates group, Bob joins via invite
    const groupRes = await alicePage.request.post('/api/groups', {
      data: { name: `ChGroup2-${Date.now()}` },
    })
    const group = (await groupRes.json()) as { id: number | string }

    const inviteRes = await alicePage.request.post(`/api/groups/${group.id}/invites`)
    const invite = (await inviteRes.json()) as { hash: string }

    await bobPage.goto(`/invites/${invite.hash}`)
    await waitForHydration(bobPage)
    await bobPage.getByRole('button', { name: /accept|join/i }).click()

    // Bob navigates to the group and tries to create a channel
    await bobPage.goto(`/groups/${group.id}`)
    await waitForHydration(bobPage)

    // The create channel button should not be visible or should be disabled for non-founders
    const createBtn = bobPage.getByRole('button', { name: /create channel|add channel/i })
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
