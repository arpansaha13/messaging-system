import path from 'node:path'
import { test as base, type Page } from '@playwright/test'
import { getDirname } from '../helpers/dirname'

const __dirname = getDirname(import.meta.url)
const AUTH_DIR = path.join(__dirname, '../.auth')

type AuthFixtures = {
  alicePage: Page
  bobPage: Page
  charliePage: Page
}

export const test = base.extend<AuthFixtures>({
  alicePage: async ({ browser }, use) => {
    const ctx = await browser.newContext({
      storageState: path.join(AUTH_DIR, 'alice.json'),
    })
    const page = await ctx.newPage()
    await use(page)
    await ctx.close()
  },

  bobPage: async ({ browser }, use) => {
    const ctx = await browser.newContext({
      storageState: path.join(AUTH_DIR, 'bob.json'),
    })
    const page = await ctx.newPage()
    await use(page)
    await ctx.close()
  },

  charliePage: async ({ browser }, use) => {
    const ctx = await browser.newContext({
      storageState: path.join(AUTH_DIR, 'charlie.json'),
    })
    const page = await ctx.newPage()
    await use(page)
    await ctx.close()
  },
})

export { expect } from '@playwright/test'
