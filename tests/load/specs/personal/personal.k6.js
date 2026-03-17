import http from 'k6/http'
import { check, fail, sleep } from 'k6'
import { TEST_USERS } from '../../fixtures/users.js'

// Nginx base URL (requests proxy to backend).
const BASE_URL = 'http://localhost:7500'

export const options = {
  // Stress ramp: 10 -> 100 VUs in 10m, then hold 2m.
  scenarios: {
    default: {
      executor: 'ramping-vus',
      startVUs: 10,
      stages: [
        { duration: '10m', target: 120 },
        { duration: '2m', target: 120 },
      ],
      gracefulRampDown: '30s',
      gracefulStop: '30s',
    },
  },
  thresholds: {
    // Guardrails for error rate and latency.
    http_req_failed: ['rate<0.01'],
    http_req_duration: [
      'p(90)<800',
      'p(95)<1000',
      'p(99)<1500',
    ],
  },
}

function login(email, password) {
  // Authenticate and capture the session cookie token.
  const res = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ email, password }),
    { headers: { 'Content-Type': 'application/json' } },
  )

  if (res.status !== 200) {
    fail(`Login failed for ${email} (status ${res.status}). Ensure test users are seeded.`)
  }

  const setCookie = res.headers['Set-Cookie'] || res.headers['set-cookie']
  if (!setCookie) {
    fail(`Login response missing Set-Cookie for ${email}.`)
  }

  const match = /session=([^;]+)/.exec(setCookie)
  if (!match) {
    fail(`Could not parse session cookie for ${email}.`)
  }

  return match[1]
}

function getMe(sessionToken) {
  // Resolve the user ID needed for message targeting.
  const res = http.get(`${BASE_URL}/api/users/me`, {
    headers: { Cookie: `session=${sessionToken}` },
  })

  if (res.status !== 200) {
    fail(`GetMe failed (status ${res.status}).`)
  }

  return res.json()
}

function ensureContact(sessionToken, userIdToAdd, alias) {
  // Ensure the users are in each other's contact list (idempotent).
  const res = http.post(
    `${BASE_URL}/api/contacts`,
    JSON.stringify({ userIdToAdd, alias }),
    {
      headers: {
        'Content-Type': 'application/json',
        Cookie: `session=${sessionToken}`,
      },
    },
  )

  if (res.status !== 201 && res.status !== 409) {
    // Allow already-exists conflicts, warn on anything else.
    console.warn(`Ensure contact failed (status ${res.status}).`)
  }
}

export function setup() {
  // Seed auth context and ensure a contact relationship.
  const aliceToken = login(TEST_USERS.alice.email, TEST_USERS.alice.password)
  const bobToken = login(TEST_USERS.bob.email, TEST_USERS.bob.password)

  const alice = getMe(aliceToken)
  const bob = getMe(bobToken)

  ensureContact(aliceToken, bob.id, 'Bob')
  ensureContact(bobToken, alice.id, 'Alice')

  return {
    alice: { token: aliceToken, id: alice.id },
    bob: { token: bobToken, id: bob.id },
  }
}

export default function personalFlow(data) {
  // Alternate senders across VUs to spread traffic.
  const useAlice = __VU % 2 === 0
  const sender = useAlice ? data.alice : data.bob
  const receiver = useAlice ? data.bob : data.alice

  // Send a personal message.
  const hash = `k6-personal-${__VU}-${__ITER}-${Date.now()}`
  const sendRes = http.post(
    `${BASE_URL}/api/messages/send/personal`,
    JSON.stringify({
      receiverId: receiver.id,
      content: `load-personal-${__VU}-${__ITER}`,
      hash,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        Cookie: `session=${sender.token}`,
      },
      tags: { flow: 'personal', action: 'send' },
    },
  )

  check(sendRes, {
    'personal send status 201': r => r.status === 201,
  })

  // List the message history for the receiver.
  const listRes = http.get(`${BASE_URL}/api/messages/${receiver.id}`, {
    headers: { Cookie: `session=${sender.token}` },
    tags: { flow: 'personal', action: 'list' },
  })

  check(listRes, {
    'personal list status 200': r => r.status === 200,
  })

  // Short think time to avoid unrealistically tight loops.
  sleep(1)
}
