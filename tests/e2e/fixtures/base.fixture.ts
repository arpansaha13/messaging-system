import { test as base } from '@playwright/test'
import { loadUserIds } from '../helpers/api'
import {
  clearAuthSessionsAndOtps,
  clearChats,
  clearContacts,
  clearGroups,
  clearInvites,
  clearMessages,
  resetProfiles,
} from '../helpers/db'

export const test = base

test.beforeEach(async () => {
  await clearMessages()
  await clearChats()
  await clearContacts()
  await clearInvites()
  await clearGroups()
  await resetProfiles(loadUserIds())
})

test.afterAll(async () => {
  await clearAuthSessionsAndOtps(loadUserIds())
})

export { expect } from '@playwright/test'
