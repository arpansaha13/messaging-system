import type { Browser, BrowserContext } from '@playwright/test'
import { TEST_USERS, type TestUserKey } from '../fixtures/users'
import { buildStorageState, login } from './api'

export type AuthUserKey = TestUserKey

export async function createAuthenticatedContext(browser: Browser, user: AuthUserKey): Promise<BrowserContext> {
  const { email, password } = TEST_USERS[user]
  const sessionToken = await login(email, password)
  return browser.newContext({
    storageState: buildStorageState(sessionToken),
  })
}

export async function createUnauthenticatedContext(browser: Browser): Promise<BrowserContext> {
  return browser.newContext()
}
