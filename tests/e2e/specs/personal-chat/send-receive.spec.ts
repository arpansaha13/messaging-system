import type { BrowserContext, Page } from '@playwright/test'
import { test, expect } from '../../fixtures/base.fixture'
import { loadUserIds } from '../../helpers/api'
import { waitForHydration } from '../../helpers/hydration'
import { createAuthenticatedContext } from '../../helpers/session'
import { waitForSocketConnection } from '../../helpers/socket'

test.describe('Personal Messaging — Send & Receive', () => {
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

  test('PM-01 sender sees optimistic (SENDING) message immediately', async () => {
    await ensureContact(alicePage, userIds.bob, 'Bob')
    await openChat(alicePage, userIds.bob)
    await alicePage.getByTestId('message-input').fill('Hello E2E!')
    await alicePage.keyboard.press('Enter')

    // Optimistic message appears immediately
    await expect(alicePage.getByTestId('temp-message-bubble').last()).toBeVisible()

  })

  test('PM-02 message transitions SENDING → SENT after API returns', async () => {
    await ensureContact(alicePage, userIds.bob, 'Bob')
    await openChat(alicePage, userIds.bob)
    await alicePage.getByTestId('message-input').fill('SENT test')
    await alicePage.keyboard.press('Enter')

    // After confirmation, temp bubble is replaced with a real message bubble
    await expect(alicePage.getByTestId('message-bubble').last()).toBeVisible({ timeout: 10_000 })

  })

  test('PM-03 Bob receives message in real-time', async () => {
    const bobPage = await bobContext.newPage()

    // Both users add each other as contacts
    await ensureContact(alicePage, userIds.bob, 'Bob')
    await ensureContact(bobPage, userIds.alice, 'Alice')

    // Bob opens chat with Alice first so socket is connected
    await openChat(bobPage, userIds.alice, true)
    await openChat(alicePage, userIds.bob, true)

    const msg = `realtime-${Date.now()}`
    await alicePage.getByTestId('message-input').fill(msg)
    await alicePage.keyboard.press('Enter')

    // Bob sees the message without a page refresh
    await expect(bobPage.getByTestId('message-bubble').filter({ hasText: msg })).toBeVisible({ timeout: 15_000 })

    await bobPage.close()
  })

  test('PM-04 Bob receipt triggers DELIVERED on Alice side', async () => {
    const bobPage = await bobContext.newPage()

    await ensureContact(alicePage, userIds.bob, 'Bob')
    await ensureContact(bobPage, userIds.alice, 'Alice')

    await openChat(bobPage, userIds.alice, true)
    await openChat(alicePage, userIds.bob, true)

    await alicePage.getByTestId('message-input').fill('deliver test')
    await alicePage.keyboard.press('Enter')

    // Wait for DELIVERED status icon (title or aria attribute set by MsgStatusIcon)
    await expect(alicePage.getByTestId('msg-status-icon').last()).toHaveAttribute('data-status', /^(2|3)$/, {
      timeout: 10_000,
    })

    await bobPage.close()
  })

  test('PM-05 Bob opening chat triggers READ on Alice side', async () => {
    const bobPage = await bobContext.newPage()

    await ensureContact(alicePage, userIds.bob, 'Bob')
    await ensureContact(bobPage, userIds.alice, 'Alice')

    // Alice sends message while Bob is not in the chat
    await openChat(alicePage, userIds.bob, true)
    await alicePage.getByTestId('message-input').fill('read test')
    await alicePage.keyboard.press('Enter')
    await expect(alicePage.getByTestId('message-bubble').last()).toBeVisible({ timeout: 10_000 })

    // Bob opens the chat
    await openChat(bobPage, userIds.alice, true)

    // Alice's message status updates to READ
    await expect(alicePage.getByTestId('msg-status-icon').last()).toHaveAttribute('data-status', '3', {
      timeout: 10_000,
    })

    await bobPage.close()
  })

  test('PM-06 message content is correctly displayed for both users', async () => {
    const bobPage = await bobContext.newPage()

    await ensureContact(alicePage, userIds.bob, 'Bob')
    await ensureContact(bobPage, userIds.alice, 'Alice')

    await openChat(bobPage, userIds.alice, true)
    await openChat(alicePage, userIds.bob, true)

    const msg = `Hello E2E! ${Date.now()}`
    await alicePage.getByTestId('message-input').fill(msg)
    await alicePage.keyboard.press('Enter')

    await expect(alicePage.getByTestId('message-bubble').filter({ hasText: msg }).first()).toBeVisible({
      timeout: 10_000,
    })
    await expect(bobPage.getByTestId('message-bubble').filter({ hasText: msg }).first()).toBeVisible({
      timeout: 10_000,
    })

    await bobPage.close()
  })

  test('PM-07 empty message is not sent', async () => {
    await ensureContact(alicePage, userIds.bob, 'Bob')
    await openChat(alicePage, userIds.bob)

    // Press Enter with empty input
    await alicePage.getByTestId('message-input').click()
    await alicePage.keyboard.press('Enter')

    // No message bubble or temp bubble should appear
    await expect(alicePage.getByTestId('temp-message-bubble')).not.toBeVisible()

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
