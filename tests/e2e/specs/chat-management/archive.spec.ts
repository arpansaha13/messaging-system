import type { BrowserContext, Page } from '@playwright/test'
import { test, expect } from '../../fixtures/base.fixture'
import { loadUserIds } from '../../helpers/api'
import { waitForHydration } from '../../helpers/hydration'
import { createAuthenticatedContext } from '../../helpers/session'
import { archiveChat, ensureChatReady, waitForChatState } from '../../helpers/chat'
import { waitForSocketConnection } from '../../helpers/socket'

test.describe('Chat Management — Archive', () => {
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
    await ensureChatReady(alicePage, userIds.bob)
  })

  test.afterEach(async () => {
    await alicePage?.close()
  })

  test('A-01 archive chat removes it from main list and shows in /archived', async () => {
    await alicePage.goto('/')
    await waitForHydration(alicePage)

    // Right-click on the chat list item to open context menu
    const chatItem = alicePage.getByTestId('chat-list-item').filter({ hasText: 'Bob' }).first()
    await expect(chatItem).toBeVisible({ timeout: 10_000 })
    await chatItem.click({ button: 'right' })
    await alicePage.getByText('Archive chat').click()

    // Chat is gone from main list
    await expect(chatItem).not.toBeVisible({ timeout: 5_000 })

    // Chat appears in /archived
    await alicePage.goto('/archived')
    await waitForHydration(alicePage)
    await expect(alicePage.getByTestId('chat-list-item').filter({ hasText: 'Bob' }).first()).toBeVisible()

    // Verify archived state persists on reload
    await alicePage.reload()
    await waitForHydration(alicePage)
    await expect(alicePage.getByTestId('chat-list-item').filter({ hasText: 'Bob' }).first()).toBeVisible()
  })

  test('A-02 unarchive chat returns it to main list', async () => {
    // Archive first via API
    await archiveChat(alicePage, userIds.bob)

    await alicePage.goto('/archived')
    await waitForHydration(alicePage)
    const archivedItem = alicePage.getByTestId('chat-list-item').filter({ hasText: 'Bob' }).first()
    await expect(archivedItem).toBeVisible()

    // Right-click → Unarchive
    await archivedItem.click({ button: 'right' })
    await alicePage.getByText('Unarchive chat').click()

    await expect(archivedItem).not.toBeVisible({ timeout: 5_000 })

    // Appears back in main list
    await alicePage.goto('/')
    await waitForHydration(alicePage)
    await expect(alicePage.getByTestId('chat-list-item').filter({ hasText: 'Bob' }).first()).toBeVisible()

    // Verify unarchived state persists on reload
    await alicePage.reload()
    await waitForHydration(alicePage)
    await expect(alicePage.getByTestId('chat-list-item').filter({ hasText: 'Bob' }).first()).toBeVisible()
  })

  test('A-03 new message from archived contact auto-unarchives the chat', async () => {
    const bobPage = await bobContext.newPage()

    await bobPage.request.post('/api/contacts', {
      data: { userIdToAdd: userIds.alice, alias: 'Alice' },
    })

    // Alice archives Bob's chat via API
    await archiveChat(alicePage, userIds.bob)

    // Alice opens home to observe (ensure socket connects)
    const socketReady = waitForSocketConnection(alicePage)
    await alicePage.goto('/')
    await waitForHydration(alicePage)
    await socketReady

    // Bob sends a message to Alice
    await bobPage.goto(`/?to=${userIds.alice}`)
    await waitForHydration(bobPage)
    await bobPage.getByTestId('message-input').fill('unarchive trigger')
    await bobPage.keyboard.press('Enter')

    await waitForChatState(alicePage, userIds.bob, false, 20, 500)

    // Alice's chat list should show Bob's chat (auto-unarchived)
    await alicePage.reload()
    await waitForHydration(alicePage)
    await expect(alicePage.getByTestId('chat-list-item').filter({ hasText: 'Bob' }).first()).toBeVisible({
      timeout: 15_000,
    })

    await bobPage.close()
  })
})

