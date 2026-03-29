import type { Page } from '@playwright/test'

export async function waitForSocketConnection(page: Page, timeoutMs = 10_000): Promise<void> {
  const socketPromise = page.waitForEvent('websocket', {
    timeout: timeoutMs,
    predicate: socket => socket.url().includes('/ws/socket'),
  })
  await socketPromise
  await page.waitForTimeout(500)
}
