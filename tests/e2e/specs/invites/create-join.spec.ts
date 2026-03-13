import type { BrowserContext, Page } from '@playwright/test'
import { test, expect } from '../../fixtures/base.fixture'
import { waitForHydration } from '../../helpers/hydration'
import { createAuthenticatedContext } from '../../helpers/session'

test.describe('Invites — Create & Join', () => {
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

  test('I-01 create invite returns a navigable hash', async () => {
    alicePage = await aliceContext.newPage()

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

  })

  test('I-02 Bob joins group via invite link', async () => {
    alicePage = await aliceContext.newPage()
    bobPage = await bobContext.newPage()

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

  })

  test('I-03 expired invite shows error state', async () => {
    alicePage = await aliceContext.newPage()
    bobPage = await bobContext.newPage()

    const groupRes = await alicePage.request.post('/api/groups', {
      data: { name: `ExpGroup-${Date.now()}` },
    })

    // Note: default invite expiry may differ by environment. This test uses a
    // non-existent/fake hash to simulate an expired/invalid invite.
    await bobPage.goto('/invites/expired-hash-that-does-not-exist')
    await waitForHydration(bobPage)

    await expect(bobPage.getByText(/expired|invalid|not found/i)).toBeVisible({ timeout: 10_000 })

  })
})
