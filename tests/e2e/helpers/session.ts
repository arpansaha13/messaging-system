import path from 'node:path'
import type { Browser, BrowserContext } from '@playwright/test'
import { TEST_USERS, type TestUserKey } from '../fixtures/users'
import { buildStorageState, login } from './api'
import { getDirname } from './dirname'

const __dirname = getDirname(import.meta.url)
const AUTH_DIR = path.join(__dirname, '../.auth')

export type AuthUserKey = TestUserKey

export function getStorageStatePath(user: AuthUserKey): string {
  return path.join(AUTH_DIR, `${user}.json`)
}

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
