import type { Page } from '@playwright/test'

/**
 * Waits until the Nuxt app has fully hydrated on the client.
 * The hydration-flag.client.ts plugin sets `document.body.dataset.hydrated = 'true'`
 * inside the `app:mounted` hook, which fires once SSR hydration is complete.
 * Call this after every page.goto() before interacting with any elements.
 */
export async function waitForHydration(page: Page): Promise<void> {
  await page.waitForFunction(() => document.body.dataset['hydrated'] === 'true')
}
