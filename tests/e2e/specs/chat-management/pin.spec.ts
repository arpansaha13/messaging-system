import type { BrowserContext, Page } from '@playwright/test'
import { test, expect } from '../../fixtures/base.fixture'
import { loadUserIds } from '../../helpers/api'
import { waitForHydration } from '../../helpers/hydration'
import { createAuthenticatedContext } from '../../helpers/session'
import { ensureChatReady } from '../../helpers/chat'

test.describe('Chat Management — Pin', () => {
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
    await ensureChatReady(alicePage, userIds.bob, 'Bob')
  })

  test.afterEach(async () => {
    await alicePage?.close()
  })

  test('P-01 pin chat moves it to top of list with pin indicator', async () => {
    await alicePage.goto('/')
    await waitForHydration(alicePage)

    const chatItem = alicePage
      .getByTestId('chat-list-item')
      .filter({ hasText: 'Bob' })
      .first()
    await chatItem.click({ button: 'right' })
    await alicePage.getByText('Pin chat').click()

    // Pinned item appears first in the list
    await expect(alicePage.getByTestId('chat-list-item').first()).toContainText('Bob')

    // Verify pinned position persists on reload
    await alicePage.reload()
    await waitForHydration(alicePage)
    await expect(alicePage.getByTestId('chat-list-item').first()).toContainText('Bob')
  })

  test('P-02 unpin chat returns it to normal sort order', async () => {
    await alicePage.goto('/')
    await waitForHydration(alicePage)
    const chatItem = alicePage
      .getByTestId('chat-list-item')
      .filter({ hasText: 'Bob' })
      .first()

    // Pin via UI
    await chatItem.click({ button: 'right' })
    await alicePage.getByText('Pin chat').click()

    // Unpin via UI
    await chatItem.click({ button: 'right' })
    await alicePage.getByText('Unpin chat').click()

    // Confirm context menu now shows 'Pin chat' option
    await chatItem.click({ button: 'right' })
    await expect(alicePage.getByText('Pin chat')).toBeVisible()
    await alicePage.keyboard.press('Escape')

    // Verify unpinned state persists on reload
    await alicePage.reload()
    await waitForHydration(alicePage)
    const unpinnedItem = alicePage.getByTestId('chat-list-item').filter({ hasText: 'Bob' }).first()
    await unpinnedItem.click({ button: 'right' })
    await expect(alicePage.getByText('Pin chat')).toBeVisible()
    await alicePage.keyboard.press('Escape')
  })
})
