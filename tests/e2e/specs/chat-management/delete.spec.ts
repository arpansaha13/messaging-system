import { test, expect } from '../../fixtures/auth.fixture'
import { loadUserIds } from '../../helpers/api'
import { waitForHydration } from '../../helpers/hydration'

test.describe('Chat Management — Delete', () => {
  let userIds: ReturnType<typeof loadUserIds>

  test.beforeAll(() => {
    userIds = loadUserIds()
  })

  test.beforeEach(async ({ alicePage }) => {
    await alicePage.request.post('/api/contacts', {
      data: { userIdToAdd: userIds.bob, alias: 'Bob' },
    })
    await alicePage.request.post('/api/messages/send/personal', {
      data: { receiverId: userIds.bob, content: 'delete test setup' },
    })
  })

  test('D-01 delete chat removes it from list after confirmation', async ({ alicePage }) => {
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

  test('D-02 cancel delete keeps chat in list', async ({ alicePage }) => {
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
