import type { Page } from '@playwright/test'

export type ChatState = { archived: boolean }

export async function ensureChatReady(page: Page, receiverId: number, alias = 'Bob'): Promise<void> {
  const contactRes = await page.request.post('/api/contacts', {
    data: { userIdToAdd: receiverId, alias },
  })
  if (!contactRes.ok()) {
    const body = await contactRes.text()
    throw new Error(`Failed to add contact (${contactRes.status}): ${body}`)
  }

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const chatState = await getChatState(page, receiverId)
    if (chatState) {
      if (chatState.archived) {
        await unarchiveChat(page, receiverId)
      }
      return
    }

    const sendRes = await page.request.post('/api/messages/send/personal', {
      data: { receiverId, content: `chat setup ${Date.now()}` },
    })
    if (!sendRes.ok()) {
      await page.waitForTimeout(1000)
      continue
    }

    await page.waitForTimeout(1000)
  }

  throw new Error(`Chat for receiver ${receiverId} did not appear`)
}

export async function getChatState(page: Page, receiverId: number): Promise<ChatState | null> {
  const unarchivedRes = await page.request.get('/api/chats')
  const archivedRes = await page.request.get('/api/chats/archived')

  if (!unarchivedRes.ok() || !archivedRes.ok()) {
    return null
  }

  const unarchived = (await unarchivedRes.json()) as { receiver: { id: number } }[]
  const archived = (await archivedRes.json()) as { receiver: { id: number } }[]

  if (unarchived.some(chat => chat.receiver.id === receiverId)) {
    return { archived: false }
  }
  if (archived.some(chat => chat.receiver.id === receiverId)) {
    return { archived: true }
  }
  return null
}

export async function waitForChatState(
  page: Page,
  receiverId: number,
  archived: boolean,
  maxAttempts = 15,
  intervalMs = 500,
): Promise<void> {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const chatState = await getChatState(page, receiverId)
    if (chatState && chatState.archived === archived) {
      return
    }
    await page.waitForTimeout(intervalMs)
  }
  throw new Error(`Chat for receiver ${receiverId} did not reach archived=${String(archived)}`)
}

export async function archiveChat(page: Page, receiverId: number): Promise<void> {
  const res = await page.request.patch(`/api/chats/${receiverId}/archive`)
  if (!res.ok()) {
    const body = await res.text()
    throw new Error(`Failed to archive chat (${res.status}): ${body}`)
  }
  await waitForChatState(page, receiverId, true)
}

export async function unarchiveChat(page: Page, receiverId: number): Promise<void> {
  const res = await page.request.patch(`/api/chats/${receiverId}/unarchive`)
  if (!res.ok()) {
    const body = await res.text()
    throw new Error(`Failed to unarchive chat (${res.status}): ${body}`)
  }
  await waitForChatState(page, receiverId, false)
}
