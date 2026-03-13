import type { BrowserContext, Page } from '@playwright/test'
import { test, expect } from '../../fixtures/base.fixture'
import { loadUserIds } from '../../helpers/api'
import { waitForHydration } from '../../helpers/hydration'
import { createAuthenticatedContext } from '../../helpers/session'

test.describe('Chat Management — Delete', () => {
  let userIds: ReturnType<typeof loadUserIds>
  let aliceContext: BrowserContext
  let alicePage: Page

  test.beforeAll(async ({ browser }) => {
    userIds = loadUserIds()
    aliceContext = await createAuthenticatedContext(browser, 'alice')
  })

  test.afterAll(async () => {
    await aliceContext?.close()
  })

  test.beforeEach(async () => {
    alicePage = await aliceContext.newPage()
    const contactRes = await alicePage.request.post('/api/contacts', {
      data: { userIdToAdd: userIds.bob, alias: 'Bob' },
    })
    if (!contactRes.ok()) {
      const body = await contactRes.text()
      throw new Error(`Failed to add contact (${contactRes.status}): ${body}`)
    }
    const messageRes = await alicePage.request.post('/api/messages/send/personal', {
      data: { receiverId: userIds.bob, content: 'delete test setup' },
    })
    if (!messageRes.ok()) {
      const body = await messageRes.text()
      throw new Error(`Failed to send message (${messageRes.status}): ${body}`)
    }
  })

  test.afterEach(async () => {
    await alicePage?.close()
  })

  test('D-01 delete chat removes it from list after confirmation', async () => {
    await alicePage.goto('/')
    await waitForHydration(alicePage)

    const chatItem = alicePage
      .getByTestId('chat-list-item')
      .filter({ hasText: 'Bob' })
      .first()
    await chatItem.click({ button: 'right' })
    await alicePage.getByText('Delete chat').click()

    // Confirm in modal
    await alicePage.getByTestId('delete-chat-confirm').click()

    await expect(chatItem).not.toBeVisible({ timeout: 5_000 })
  })

  test('D-02 cancel delete keeps chat in list', async () => {
    await alicePage.goto('/')
    await waitForHydration(alicePage)

    const chatItem = alicePage
      .getByTestId('chat-list-item')
      .filter({ hasText: 'Bob' })
      .first()
    await chatItem.click({ button: 'right' })
    await alicePage.getByText('Delete chat').click()

    // Cancel in modal
    await alicePage.getByTestId('delete-chat-cancel').click()

    await expect(chatItem).toBeVisible()
  })
})
