import { test as base, type Page } from '@playwright/test'
import { createAuthenticatedContext } from '../helpers/session'

type AuthFixtures = {
  alicePage: Page
  bobPage: Page
  charliePage: Page
}

export const test = base.extend<AuthFixtures>({
  alicePage: async ({ browser }, use) => {
    const ctx = await createAuthenticatedContext(browser, 'alice')
    const page = await ctx.newPage()
    await use(page)
    await ctx.close()
  },

  bobPage: async ({ browser }, use) => {
    const ctx = await createAuthenticatedContext(browser, 'bob')
    const page = await ctx.newPage()
    await use(page)
    await ctx.close()
  },

  charliePage: async ({ browser }, use) => {
    const ctx = await createAuthenticatedContext(browser, 'charlie')
    const page = await ctx.newPage()
    await use(page)
    await ctx.close()
  },
})

export { expect } from '@playwright/test'
