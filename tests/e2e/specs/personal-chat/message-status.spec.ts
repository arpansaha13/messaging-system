import path from 'node:path'
import { test, expect } from '@playwright/test'
import { loadUserIds } from '../../helpers/api'
import { getDirname } from '../../helpers/dirname'
import { waitForHydration } from '../../helpers/hydration'

const __dirname = getDirname(import.meta.url)
const AUTH_DIR = path.join(__dirname, '../../.auth')

test.describe('Personal Messaging — Message Status Progression', () => {
  let userIds: ReturnType<typeof loadUserIds>

  test.beforeAll(() => {
    userIds = loadUserIds()
  })

  test('SENT → DELIVERED → READ chain completes', async ({ browser }) => {
    const aliceCtx = await browser.newContext({ storageState: path.join(AUTH_DIR, 'alice.json') })
    const bobCtx = await browser.newContext({ storageState: path.join(AUTH_DIR, 'bob.json') })
    const alicePage = await aliceCtx.newPage()
    const bobPage = await bobCtx.newPage()

    await alicePage.request.post('/api/contacts', {
      data: { userIdToAdd: userIds.bob, alias: 'Bob' },
    })
    await bobPage.request.post('/api/contacts', {
      data: { userIdToAdd: userIds.alice, alias: 'Alice' },
    })

    // Step 1: Alice sends, message is confirmed (SENT)
    await alicePage.goto(`/?to=${userIds.bob}`)
    await waitForHydration(alicePage)
    await alicePage.getByTestId('message-input').fill('status chain test')
    await alicePage.keyboard.press('Enter')

    const statusIcon = alicePage.getByTestId('msg-status-icon').last()

    // SENT — chat-worker confirms persistence
    await expect(statusIcon).toHaveAttribute('data-status', 'sent', { timeout: 10_000 })

    // Step 2: Bob connects → triggers DELIVERED
    await bobPage.goto(`/?to=${userIds.alice}`)
    await waitForHydration(bobPage)
    await expect(statusIcon).toHaveAttribute('data-status', 'delivered', { timeout: 10_000 })

    // Step 3: Bob is already in the chat → READ fires automatically
    await expect(statusIcon).toHaveAttribute('data-status', 'read', { timeout: 10_000 })

    await aliceCtx.close()
    await bobCtx.close()
  })
})
