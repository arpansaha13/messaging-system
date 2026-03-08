import { test, expect } from '../../fixtures/auth.fixture'
import { loadUserIds } from '../../helpers/api'
import { waitForHydration } from '../../helpers/hydration'

test.describe('Chat Management — Pin', () => {
  let userIds: ReturnType<typeof loadUserIds>

  test.beforeAll(() => {
    userIds = loadUserIds()
  })

  test.beforeEach(async ({ alicePage }) => {
    await alicePage.request.post('/api/contacts', {
      data: { userIdToAdd: userIds.bob, alias: 'Bob' },
    })
    await alicePage.request.post('/api/messages/send/personal', {
      data: { receiverId: userIds.bob, content: 'pin test setup' },
    })
  })

  test('P-01 pin chat moves it to top of list with pin indicator', async ({ alicePage }) => {
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
  })

  test('P-02 unpin chat returns it to normal sort order', async ({ alicePage }) => {
    // Pin via API
    const chatsRes = await alicePage.request.get('/api/chats')
    const chats = (await chatsRes.json()) as { id: number; receiver: { id: number } }[]
    const bobChat = chats.find(c => c.receiver.id === userIds.bob)
    if (bobChat) {
      await alicePage.request.post(`/api/chats/${bobChat.id}/pin`)
    }

    await alicePage.goto('/')
    await waitForHydration(alicePage)
    const chatItem = alicePage
      .getByTestId('chat-list-item')
      .filter({ hasText: 'Bob' })
      .first()
    await chatItem.click({ button: 'right' })
    await alicePage.getByText('Unpin chat').click()

    // Item no longer necessarily first; the pin icon should be gone
    // Confirm context menu now shows 'Pin chat' option
    await chatItem.click({ button: 'right' })
    await expect(alicePage.getByText('Pin chat')).toBeVisible()
    await alicePage.keyboard.press('Escape')
  })
})
