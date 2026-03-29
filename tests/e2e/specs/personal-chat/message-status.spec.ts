import type { BrowserContext, Page } from '@playwright/test'
import { test, expect } from '../../fixtures/base.fixture'
import { loadUserIds } from '../../helpers/api'
import { waitForHydration } from '../../helpers/hydration'
import { createAuthenticatedContext } from '../../helpers/session'
import { waitForSocketConnection } from '../../helpers/socket'

test.describe('Personal Messaging — Message Status Progression', () => {
  let userIds: ReturnType<typeof loadUserIds>
  let aliceContext: BrowserContext
  let bobContext: BrowserContext
  let alicePage: Page

  test.beforeAll(async ({ browser }) => {
    userIds = loadUserIds()
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

  test('SENT → DELIVERED → READ chain completes', async () => {
    const bobPage = await bobContext.newPage()

    await ensureContact(alicePage, userIds.bob, 'Bob')
    await ensureContact(bobPage, userIds.alice, 'Alice')

    // Step 1: Alice sends, message is confirmed (SENT)
    await openChat(alicePage, userIds.bob, true)
    const msg = `status chain ${Date.now()}`
    await alicePage.getByTestId('message-input').fill(msg)
    await alicePage.keyboard.press('Enter')

    await waitForMessageInApi(alicePage, userIds.bob, msg)
    await alicePage.reload()
    await waitForHydration(alicePage)
    await expect(alicePage.getByTestId('message-bubble').filter({ hasText: msg }).first()).toBeVisible({
      timeout: 10_000,
    })
    const statusIcon = alicePage.getByTestId('msg-status-icon').last()

    // SENT — chat-worker confirms persistence
    await expect(statusIcon).toHaveAttribute('data-status', '1', { timeout: 10_000 })

    // Step 2: Bob connects → triggers DELIVERED
    await openChat(bobPage, userIds.alice, true)
    await expect(statusIcon).toHaveAttribute('data-status', /^(2|3)$/, { timeout: 10_000 })

    // Step 3: Bob is already in the chat → READ fires automatically
    await expect(statusIcon).toHaveAttribute('data-status', '3', { timeout: 10_000 })

    await bobPage.close()
  })
})

async function ensureContact(page: Page, userIdToAdd: number, alias: string) {
  const res = await page.request.post('/api/contacts', {
    data: { userIdToAdd, alias },
  })
  if (!res.ok()) {
    const body = await res.text()
    throw new Error(`Failed to add contact (${res.status}): ${body}`)
  }
}

async function openChat(page: Page, receiverId: number, waitForSocket = false) {
  const socketReady = waitForSocket ? waitForSocketConnection(page) : null
  await page.goto(`/?to=${receiverId}`)
  await waitForHydration(page)
  if (socketReady) {
    await socketReady
  }
}

async function waitForMessageInApi(page: Page, receiverId: number, content: string) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const res = await page.request.get(`/api/messages/${receiverId}`)
    if (res.ok()) {
      const data = (await res.json()) as { messages: { content: string }[] }
      if (data.messages?.some(msg => msg.content === content)) {
        return
      }
    }
    await page.waitForTimeout(1000)
  }
  throw new Error(`Message "${content}" did not appear in API`)
}
