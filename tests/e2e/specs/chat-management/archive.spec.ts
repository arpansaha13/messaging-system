import path from 'node:path'
import type { Page } from '@playwright/test'
import { test, expect } from '../../fixtures/auth.fixture'
import { loadUserIds } from '../../helpers/api'
import { getDirname } from '../../helpers/dirname'
import { waitForHydration } from '../../helpers/hydration'

const __dirname = getDirname(import.meta.url)

test.describe('Chat Management — Archive', () => {
  let userIds: ReturnType<typeof loadUserIds>

  test.beforeAll(() => {
    userIds = loadUserIds()
  })

  test.beforeEach(async ({ alicePage }) => {
    // Ensure Alice has Bob as contact and a chat exists
    await alicePage.request.post('/api/contacts', {
      data: { userIdToAdd: userIds.bob, alias: 'Bob' },
    })
    // Send a message to create a chat record
    await alicePage.request.post('/api/messages/send/personal', {
      data: { receiverId: userIds.bob, content: 'archive test setup' },
    })

    const chatState = await waitForChat(alicePage, userIds.bob)
    if (chatState?.archived) {
      await alicePage.request.patch(`/api/chats/${userIds.bob}/unarchive`)
    }
  })

  test('A-01 archive chat removes it from main list and shows in /archived', async ({ alicePage }) => {
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
  })

  test('A-02 unarchive chat returns it to main list', async ({ alicePage }) => {
    // Archive first via API
    const chatsRes = await alicePage.request.get('/api/chats')
    const chats = (await chatsRes.json()) as { unarchived: { receiver: { id: number }; chat: { id: number } }[] }
    const bobChat = chats.unarchived.find(c => c.receiver.id === userIds.bob)
    if (bobChat) {
      await alicePage.request.patch(`/api/chats/${bobChat.chat.id}/archive`)
    }

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
  })

  test('A-03 new message from archived contact auto-unarchives the chat', async ({ browser }) => {
    const aliceCtx = await browser.newContext({
      storageState: path.join(__dirname, '../../.auth/alice.json'),
    })
    const bobCtx = await browser.newContext({
      storageState: path.join(__dirname, '../../.auth/bob.json'),
    })
    const alicePage = await aliceCtx.newPage()
    const bobPage = await bobCtx.newPage()

    await bobPage.request.post('/api/contacts', {
      data: { userIdToAdd: userIds.alice, alias: 'Alice' },
    })

    // Alice archives Bob's chat via API
    const chatsRes = await alicePage.request.get('/api/chats')
    const chats = (await chatsRes.json()) as { unarchived: { receiver: { id: number }; chat: { id: number } }[] }
    const bobChat = chats.unarchived.find(c => c.receiver.id === userIds.bob)
    if (bobChat) {
      await alicePage.request.patch(`/api/chats/${bobChat.chat.id}/archive`)
    }

    // Alice opens home to observe
    await alicePage.goto('/')
    await waitForHydration(alicePage)

    // Bob sends a message to Alice
    await bobPage.goto(`/?to=${userIds.alice}`)
    await waitForHydration(bobPage)
    await bobPage.getByTestId('message-input').fill('unarchive trigger')
    await bobPage.keyboard.press('Enter')

    // Alice's chat list should show Bob's chat (auto-unarchived)
    await expect(alicePage.getByTestId('chat-list-item').filter({ hasText: 'Bob' }).first()).toBeVisible({
      timeout: 10_000,
    })

    await aliceCtx.close()
    await bobCtx.close()
  })
})

async function waitForChat(page: Page, receiverId: number, maxAttempts = 15, intervalMs = 1000) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const res = await page.request.get('/api/chats')
    if (res.ok()) {
      const data = (await res.json()) as {
        unarchived: { receiver: { id: number } }[]
        archived: { receiver: { id: number } }[]
      }
      if (data.unarchived.some(chat => chat.receiver.id === receiverId)) {
        return { archived: false }
      }
      if (data.archived.some(chat => chat.receiver.id === receiverId)) {
        return { archived: true }
      }
    }
    await page.waitForTimeout(intervalMs)
  }
  throw new Error(`Chat for receiver ${receiverId} did not appear`)
}
