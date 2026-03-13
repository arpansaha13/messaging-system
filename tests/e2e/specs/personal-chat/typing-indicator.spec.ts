import type { BrowserContext, Page } from '@playwright/test'
import { test, expect } from '@playwright/test'
import { loadUserIds } from '../../helpers/api'
import { waitForHydration } from '../../helpers/hydration'
import { createAuthenticatedContext } from '../../helpers/session'
import { waitForSocketConnection } from '../../helpers/socket'

test.describe('Typing Indicator', () => {
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

  test('TY-01 typing shows indicator on receiver side', async () => {
    const bobPage = await bobContext.newPage()

    await ensureContact(alicePage, userIds.bob, 'Bob')
    await ensureContact(bobPage, userIds.alice, 'Alice')

    await openChat(bobPage, userIds.alice, true)
    await openChat(alicePage, userIds.bob, true)

    // Alice starts typing
    await alicePage.getByTestId('message-input').type('typing...')

    // Bob sees typing indicator in the chat header subtitle
    await expect(bobPage.getByTestId('chat-header-subtitle').filter({ hasText: /typing/i })).toBeVisible({
      timeout: 5_000,
    })

    await bobPage.close()
  })

  test('TY-02 typing indicator disappears after 1s inactivity', async () => {
    const bobPage = await bobContext.newPage()

    await ensureContact(alicePage, userIds.bob, 'Bob')
    await ensureContact(bobPage, userIds.alice, 'Alice')

    await openChat(bobPage, userIds.alice, true)
    await openChat(alicePage, userIds.bob, true)

    await alicePage.getByTestId('message-input').type('typing...')
    await expect(bobPage.getByTestId('chat-header-subtitle').filter({ hasText: /typing/i })).toBeVisible({
      timeout: 5_000,
    })

    // Alice stops typing — wait > 1s
    await alicePage.waitForTimeout(1500)

    // Typing indicator disappears
    await expect(bobPage.getByTestId('chat-header-subtitle').filter({ hasText: /typing/i })).not.toBeVisible({
      timeout: 5_000,
    })

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
