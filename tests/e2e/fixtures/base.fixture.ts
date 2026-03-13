import { test as base, expect } from '@playwright/test'
import { loadUserIds } from '../helpers/api'
import { clearChats, clearContacts, clearGroups, clearInvites, clearMessages, resetProfiles } from '../helpers/db'

export const test = base

test.beforeEach(async () => {
  await clearMessages()
  await clearChats()
  await clearContacts()
  await clearInvites()
  await clearGroups()
  await resetProfiles(loadUserIds())
})

export { expect }
