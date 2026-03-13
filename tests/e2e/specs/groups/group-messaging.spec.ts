import type { BrowserContext, Page } from '@playwright/test'
import { test, expect } from '../../fixtures/base.fixture'
import { waitForHydration } from '../../helpers/hydration'
import { createAuthenticatedContext } from '../../helpers/session'
import { waitForSocketConnection } from '../../helpers/socket'

test.describe('Group Messaging', () => {
  let aliceContext: BrowserContext
  let bobContext: BrowserContext
  let alicePage: Page

  test.beforeAll(async ({ browser }) => {
    aliceContext = await createAuthenticatedContext(browser, 'alice')
    bobContext = await createAuthenticatedContext(browser, 'bob')
  })

  test.afterAll(async () => {
    await aliceContext?.close()
    await bobContext?.close()
  })

  test.beforeEach(async () => {
    alicePage = await aliceContext.newPage()
  })

  test.afterEach(async () => {
    await alicePage?.close()
  })

  test('GM-01 send group message appears in channel view', async () => {
    // Create group and channel
    const groupRes = await alicePage.request.post('/api/groups', {
      data: { name: `MsgGroup-${Date.now()}` },
    })
    if (!groupRes.ok()) {
      throw new Error(`Failed to create group (${groupRes.status()}): ${await groupRes.text()}`)
    }
    const group = (await groupRes.json()) as { id: number | string }

    const chanRes = await alicePage.request.post(`/api/groups/${group.id}/channels`, {
      data: { name: 'general' },
    })
    if (!chanRes.ok()) {
      throw new Error(`Failed to create channel (${chanRes.status()}): ${await chanRes.text()}`)
    }
    const channel = (await chanRes.json()) as { id: number | string }

    await openChannel(alicePage, group.id, channel.id)

    const msg = `group-msg-${Date.now()}`
    await alicePage.getByTestId('message-input').fill(msg)
    await alicePage.keyboard.press('Enter')

    await expect(alicePage.getByTestId('message-bubble').filter({ hasText: msg })).toBeVisible({ timeout: 10_000 })
  })

  test('GM-02 group member receives message in real-time', async () => {
    const bobPage = await bobContext.newPage()

    // Alice creates group + channel
    const groupRes = await alicePage.request.post('/api/groups', {
      data: { name: `RealtimeGroup-${Date.now()}` },
    })
    if (!groupRes.ok()) {
      throw new Error(`Failed to create group (${groupRes.status()}): ${await groupRes.text()}`)
    }
    const group = (await groupRes.json()) as { id: number | string }

    const chanRes = await alicePage.request.post(`/api/groups/${group.id}/channels`, {
      data: { name: 'general' },
    })
    if (!chanRes.ok()) {
      throw new Error(`Failed to create channel (${chanRes.status()}): ${await chanRes.text()}`)
    }
    const channel = (await chanRes.json()) as { id: number | string }

    // Alice creates invite; Bob accepts
    const inviteRes = await alicePage.request.post(`/api/groups/${group.id}/invites`)
    if (!inviteRes.ok()) {
      throw new Error(`Failed to create invite (${inviteRes.status()}): ${await inviteRes.text()}`)
    }
    const invite = (await inviteRes.json()) as { hash: string }

    await bobPage.goto(`/invites/${invite.hash}`)
    await waitForHydration(bobPage)
    await bobPage.getByRole('button', { name: /accept|join/i }).click()

    // Both navigate to the channel
    await openChannel(bobPage, group.id, channel.id)
    await openChannel(alicePage, group.id, channel.id)

    const msg = `group-rt-${Date.now()}`
    await alicePage.getByTestId('message-input').fill(msg)
    await alicePage.keyboard.press('Enter')

    await expect(bobPage.getByTestId('message-bubble').filter({ hasText: msg })).toBeVisible({ timeout: 10_000 })
    await bobPage.close()
  })

  test('GM-03 group message transitions SENDING → SENT', async () => {
    const groupRes = await alicePage.request.post('/api/groups', {
      data: { name: `StatusGroup-${Date.now()}` },
    })
    if (!groupRes.ok()) {
      throw new Error(`Failed to create group (${groupRes.status()}): ${await groupRes.text()}`)
    }
    const group = (await groupRes.json()) as { id: number | string }

    const chanRes = await alicePage.request.post(`/api/groups/${group.id}/channels`, {
      data: { name: 'general' },
    })
    if (!chanRes.ok()) {
      throw new Error(`Failed to create channel (${chanRes.status()}): ${await chanRes.text()}`)
    }
    const channel = (await chanRes.json()) as { id: number | string }

    await openChannel(alicePage, group.id, channel.id)

    await alicePage.getByTestId('message-input').fill('status test')
    await alicePage.keyboard.press('Enter')

    // Temp bubble visible first
    await expect(alicePage.getByTestId('temp-message-bubble').last()).toBeVisible()
    // Then confirmed message appears
    await expect(alicePage.getByTestId('message-bubble').last()).toBeVisible({ timeout: 10_000 })

  })
})

async function openChannel(page: Page, groupId: number | string, channelId: number | string) {
  const socketReady = waitForSocketConnection(page)
  await page.goto(`/groups/${groupId}/${channelId}`)
  await waitForHydration(page)
  await socketReady
}
