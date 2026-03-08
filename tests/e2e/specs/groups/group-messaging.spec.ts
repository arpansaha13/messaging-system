import path from 'node:path'
import { test, expect } from '@playwright/test'
import { loadUserIds } from '../../helpers/api'
import { getDirname } from '../../helpers/dirname'
import { waitForHydration } from '../../helpers/hydration'

const __dirname = getDirname(import.meta.url)
const AUTH_DIR = path.join(__dirname, '../../.auth')

test.describe('Group Messaging', () => {
  let userIds: ReturnType<typeof loadUserIds>

  test.beforeAll(() => {
    userIds = loadUserIds()
  })

  test('GM-01 send group message appears in channel view', async ({ browser }) => {
    const aliceCtx = await browser.newContext({ storageState: path.join(AUTH_DIR, 'alice.json') })
    const alicePage = await aliceCtx.newPage()

    // Create group and channel
    const groupRes = await alicePage.request.post('/api/groups', {
      data: { name: `MsgGroup-${Date.now()}` },
    })
    const group = (await groupRes.json()) as { id: number | string }

    const chanRes = await alicePage.request.post(`/api/groups/${group.id}/channels`, {
      data: { name: 'general' },
    })
    const channel = (await chanRes.json()) as { id: number | string }

    await alicePage.goto(`/groups/${group.id}/${channel.id}`)
    await waitForHydration(alicePage)

    const msg = `group-msg-${Date.now()}`
    await alicePage.getByTestId('message-input').fill(msg)
    await alicePage.keyboard.press('Enter')

    await expect(alicePage.getByTestId('message-bubble').filter({ hasText: msg })).toBeVisible({ timeout: 10_000 })

    await aliceCtx.close()
  })

  test('GM-02 group member receives message in real-time', async ({ browser }) => {
    const aliceCtx = await browser.newContext({ storageState: path.join(AUTH_DIR, 'alice.json') })
    const bobCtx = await browser.newContext({ storageState: path.join(AUTH_DIR, 'bob.json') })
    const alicePage = await aliceCtx.newPage()
    const bobPage = await bobCtx.newPage()

    // Alice creates group + channel
    const groupRes = await alicePage.request.post('/api/groups', {
      data: { name: `RealtimeGroup-${Date.now()}` },
    })
    const group = (await groupRes.json()) as { id: number | string }

    const chanRes = await alicePage.request.post(`/api/groups/${group.id}/channels`, {
      data: { name: 'general' },
    })
    const channel = (await chanRes.json()) as { id: number | string }

    // Alice creates invite; Bob accepts
    const inviteRes = await alicePage.request.post(`/api/groups/${group.id}/invites`)
    const invite = (await inviteRes.json()) as { hash: string }

    await bobPage.goto(`/invites/${invite.hash}`)
    await waitForHydration(bobPage)
    await bobPage.getByRole('button', { name: /accept|join/i }).click()

    // Both navigate to the channel
    await bobPage.goto(`/groups/${group.id}/${channel.id}`)
    await waitForHydration(bobPage)
    await alicePage.goto(`/groups/${group.id}/${channel.id}`)
    await waitForHydration(alicePage)

    const msg = `group-rt-${Date.now()}`
    await alicePage.getByTestId('message-input').fill(msg)
    await alicePage.keyboard.press('Enter')

    await expect(bobPage.getByTestId('message-bubble').filter({ hasText: msg })).toBeVisible({ timeout: 10_000 })

    await aliceCtx.close()
    await bobCtx.close()
  })

  test('GM-03 group message transitions SENDING → SENT', async ({ browser }) => {
    const aliceCtx = await browser.newContext({ storageState: path.join(AUTH_DIR, 'alice.json') })
    const alicePage = await aliceCtx.newPage()

    const groupRes = await alicePage.request.post('/api/groups', {
      data: { name: `StatusGroup-${Date.now()}` },
    })
    const group = (await groupRes.json()) as { id: number | string }

    const chanRes = await alicePage.request.post(`/api/groups/${group.id}/channels`, {
      data: { name: 'general' },
    })
    const channel = (await chanRes.json()) as { id: number | string }

    await alicePage.goto(`/groups/${group.id}/${channel.id}`)
    await waitForHydration(alicePage)

    await alicePage.getByTestId('message-input').fill('status test')
    await alicePage.keyboard.press('Enter')

    // Temp bubble visible first
    await expect(alicePage.getByTestId('temp-message-bubble').last()).toBeVisible()
    // Then confirmed message appears
    await expect(alicePage.getByTestId('message-bubble').last()).toBeVisible({ timeout: 10_000 })

    await aliceCtx.close()
  })
})
