import path from 'node:path'
import { test, expect } from '@playwright/test'
import { loadUserIds } from '../../helpers/api'
import { getDirname } from '../../helpers/dirname'
import { waitForHydration } from '../../helpers/hydration'

const __dirname = getDirname(import.meta.url)
const AUTH_DIR = path.join(__dirname, '../../.auth')

test.describe('Personal Messaging — Send & Receive', () => {
  let userIds: ReturnType<typeof loadUserIds>

  test.beforeAll(() => {
    userIds = loadUserIds()
  })

  test('PM-01 sender sees optimistic (SENDING) message immediately', async ({ browser }) => {
    const aliceCtx = await browser.newContext({ storageState: path.join(AUTH_DIR, 'alice.json') })
    const alicePage = await aliceCtx.newPage()

    // Setup: Alice adds Bob as contact
    await alicePage.request.post('/api/contacts', {
      data: { userIdToAdd: userIds.bob, alias: 'Bob' },
    })

    await alicePage.goto(`/?to=${userIds.bob}`)
    await waitForHydration(alicePage)
    await alicePage.getByTestId('message-input').fill('Hello E2E!')
    await alicePage.keyboard.press('Enter')

    // Optimistic message appears immediately
    await expect(alicePage.getByTestId('temp-message-bubble').last()).toBeVisible()

    await aliceCtx.close()
  })

  test('PM-02 message transitions SENDING → SENT after API returns', async ({ browser }) => {
    const aliceCtx = await browser.newContext({ storageState: path.join(AUTH_DIR, 'alice.json') })
    const alicePage = await aliceCtx.newPage()

    await alicePage.request.post('/api/contacts', {
      data: { userIdToAdd: userIds.bob, alias: 'Bob' },
    })

    await alicePage.goto(`/?to=${userIds.bob}`)
    await waitForHydration(alicePage)
    await alicePage.getByTestId('message-input').fill('SENT test')
    await alicePage.keyboard.press('Enter')

    // After confirmation, temp bubble is replaced with a real message bubble
    await expect(alicePage.getByTestId('message-bubble').last()).toBeVisible({ timeout: 10_000 })

    await aliceCtx.close()
  })

  test('PM-03 Bob receives message in real-time', async ({ browser }) => {
    const aliceCtx = await browser.newContext({ storageState: path.join(AUTH_DIR, 'alice.json') })
    const bobCtx = await browser.newContext({ storageState: path.join(AUTH_DIR, 'bob.json') })
    const alicePage = await aliceCtx.newPage()
    const bobPage = await bobCtx.newPage()

    // Both users add each other as contacts
    await alicePage.request.post('/api/contacts', {
      data: { userIdToAdd: userIds.bob, alias: 'Bob' },
    })
    await bobPage.request.post('/api/contacts', {
      data: { userIdToAdd: userIds.alice, alias: 'Alice' },
    })

    // Bob opens chat with Alice first so socket is connected
    await bobPage.goto(`/?to=${userIds.alice}`)
    await waitForHydration(bobPage)
    await alicePage.goto(`/?to=${userIds.bob}`)
    await waitForHydration(alicePage)

    const msg = `realtime-${Date.now()}`
    await alicePage.getByTestId('message-input').fill(msg)
    await alicePage.keyboard.press('Enter')

    // Bob sees the message without a page refresh
    await expect(bobPage.getByTestId('message-bubble').filter({ hasText: msg })).toBeVisible({ timeout: 10_000 })

    await aliceCtx.close()
    await bobCtx.close()
  })

  test('PM-04 Bob receipt triggers DELIVERED on Alice side', async ({ browser }) => {
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

    await bobPage.goto(`/?to=${userIds.alice}`)
    await waitForHydration(bobPage)
    await alicePage.goto(`/?to=${userIds.bob}`)
    await waitForHydration(alicePage)

    await alicePage.getByTestId('message-input').fill('deliver test')
    await alicePage.keyboard.press('Enter')

    // Wait for DELIVERED status icon (title or aria attribute set by MsgStatusIcon)
    await expect(alicePage.getByTestId('msg-status-icon').last()).toHaveAttribute('data-status', 'delivered', {
      timeout: 10_000,
    })

    await aliceCtx.close()
    await bobCtx.close()
  })

  test('PM-05 Bob opening chat triggers READ on Alice side', async ({ browser }) => {
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

    // Alice sends message while Bob is not in the chat
    await alicePage.goto(`/?to=${userIds.bob}`)
    await waitForHydration(alicePage)
    await alicePage.getByTestId('message-input').fill('read test')
    await alicePage.keyboard.press('Enter')
    await expect(alicePage.getByTestId('message-bubble').last()).toBeVisible({ timeout: 10_000 })

    // Bob opens the chat
    await bobPage.goto(`/?to=${userIds.alice}`)
    await waitForHydration(bobPage)

    // Alice's message status updates to READ
    await expect(alicePage.getByTestId('msg-status-icon').last()).toHaveAttribute('data-status', 'read', {
      timeout: 10_000,
    })

    await aliceCtx.close()
    await bobCtx.close()
  })

  test('PM-06 message content is correctly displayed for both users', async ({ browser }) => {
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

    await bobPage.goto(`/?to=${userIds.alice}`)
    await waitForHydration(bobPage)
    await alicePage.goto(`/?to=${userIds.bob}`)
    await waitForHydration(alicePage)

    await alicePage.getByTestId('message-input').fill('Hello E2E!')
    await alicePage.keyboard.press('Enter')

    await expect(alicePage.getByTestId('message-bubble').filter({ hasText: 'Hello E2E!' })).toBeVisible({
      timeout: 10_000,
    })
    await expect(bobPage.getByTestId('message-bubble').filter({ hasText: 'Hello E2E!' })).toBeVisible({
      timeout: 10_000,
    })

    await aliceCtx.close()
    await bobCtx.close()
  })

  test('PM-07 empty message is not sent', async ({ browser }) => {
    const aliceCtx = await browser.newContext({ storageState: path.join(AUTH_DIR, 'alice.json') })
    const alicePage = await aliceCtx.newPage()

    await alicePage.request.post('/api/contacts', {
      data: { userIdToAdd: userIds.bob, alias: 'Bob' },
    })

    await alicePage.goto(`/?to=${userIds.bob}`)
    await waitForHydration(alicePage)

    // Press Enter with empty input
    await alicePage.getByTestId('message-input').click()
    await alicePage.keyboard.press('Enter')

    // No message bubble or temp bubble should appear
    await expect(alicePage.getByTestId('temp-message-bubble')).not.toBeVisible()

    await aliceCtx.close()
  })
})
