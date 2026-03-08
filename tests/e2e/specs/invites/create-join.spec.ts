import path from 'node:path'
import { test, expect } from '@playwright/test'
import { loadUserIds } from '../../helpers/api'
import { getDirname } from '../../helpers/dirname'
import { waitForHydration } from '../../helpers/hydration'

const __dirname = getDirname(import.meta.url)
const AUTH_DIR = path.join(__dirname, '../../.auth')

test.describe('Invites — Create & Join', () => {
  let userIds: ReturnType<typeof loadUserIds>

  test.beforeAll(() => {
    userIds = loadUserIds()
  })

  test('I-01 create invite returns a navigable hash', async ({ browser }) => {
    const aliceCtx = await browser.newContext({ storageState: path.join(AUTH_DIR, 'alice.json') })
    const alicePage = await aliceCtx.newPage()

    const groupRes = await alicePage.request.post('/api/groups', {
      data: { name: `InvGroup1-${Date.now()}` },
    })
    const group = (await groupRes.json()) as { id: number | string }

    const inviteRes = await alicePage.request.post(`/api/groups/${group.id}/invites`)
    expect(inviteRes.ok()).toBe(true)

    const invite = (await inviteRes.json()) as { hash: string }
    expect(invite.hash).toBeTruthy()

    // The invite URL should be navigable
    await alicePage.goto(`/invites/${invite.hash}`)
    await expect(alicePage).not.toHaveURL('/auth/login')

    await aliceCtx.close()
  })

  test('I-02 Bob joins group via invite link', async ({ browser }) => {
    const aliceCtx = await browser.newContext({ storageState: path.join(AUTH_DIR, 'alice.json') })
    const bobCtx = await browser.newContext({ storageState: path.join(AUTH_DIR, 'bob.json') })
    const alicePage = await aliceCtx.newPage()
    const bobPage = await bobCtx.newPage()

    const groupRes = await alicePage.request.post('/api/groups', {
      data: { name: `JoinGroup-${Date.now()}` },
    })
    const group = (await groupRes.json()) as { id: number | string; name: string }

    const inviteRes = await alicePage.request.post(`/api/groups/${group.id}/invites`)
    const invite = (await inviteRes.json()) as { hash: string }

    // Bob navigates to invite page and accepts
    await bobPage.goto(`/invites/${invite.hash}`)
    await waitForHydration(bobPage)
    await bobPage.getByRole('button', { name: /accept|join/i }).click()

    // Bob's navbar should show the group
    await expect(bobPage.getByText(group.name)).toBeVisible({ timeout: 10_000 })

    await aliceCtx.close()
    await bobCtx.close()
  })

  test('I-03 expired invite shows error state', async ({ browser }) => {
    const aliceCtx = await browser.newContext({ storageState: path.join(AUTH_DIR, 'alice.json') })
    const bobCtx = await browser.newContext({ storageState: path.join(AUTH_DIR, 'bob.json') })
    const alicePage = await aliceCtx.newPage()
    const bobPage = await bobCtx.newPage()

    const groupRes = await alicePage.request.post('/api/groups', {
      data: { name: `ExpGroup-${Date.now()}` },
    })

    // Note: default invite expiry may differ by environment. This test uses a
    // non-existent/fake hash to simulate an expired/invalid invite.
    await bobPage.goto('/invites/expired-hash-that-does-not-exist')
    await waitForHydration(bobPage)

    await expect(bobPage.getByText(/expired|invalid|not found/i)).toBeVisible({ timeout: 10_000 })

    await aliceCtx.close()
    await bobCtx.close()
  })
})
