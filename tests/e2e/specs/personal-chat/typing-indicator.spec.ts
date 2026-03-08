import path from 'node:path'
import { test, expect } from '@playwright/test'
import { loadUserIds } from '../../helpers/api'
import { getDirname } from '../../helpers/dirname'
import { waitForHydration } from '../../helpers/hydration'

const __dirname = getDirname(import.meta.url)
const AUTH_DIR = path.join(__dirname, '../../.auth')

test.describe('Typing Indicator', () => {
  let userIds: ReturnType<typeof loadUserIds>

  test.beforeAll(() => {
    userIds = loadUserIds()
  })

  test('TY-01 typing shows indicator on receiver side', async ({ browser }) => {
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

    // Alice starts typing
    await alicePage.getByTestId('message-input').type('typing...')

    // Bob sees typing indicator in the chat header subtitle
    await expect(bobPage.getByTestId('chat-header-subtitle').filter({ hasText: /typing/i })).toBeVisible({
      timeout: 5_000,
    })

    await aliceCtx.close()
    await bobCtx.close()
  })

  test('TY-02 typing indicator disappears after 1s inactivity', async ({ browser }) => {
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

    await aliceCtx.close()
    await bobCtx.close()
  })
})
