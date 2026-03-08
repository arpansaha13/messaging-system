export const TEST_USERS = {
  alice: {
    email: 'alice@test.local',
    password: 'TestPass123!',
    globalName: 'Alice',
  },
  bob: {
    email: 'bob@test.local',
    password: 'TestPass123!',
    globalName: 'Bob',
  },
  charlie: {
    email: 'charlie@test.local',
    password: 'TestPass123!',
    globalName: 'Charlie',
  },
} as const

export type TestUserKey = keyof typeof TEST_USERS
