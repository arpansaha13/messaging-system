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
        { duration: '10m', target: 800 },
        { duration: '2m', target: 800 },
      ],
      gracefulRampDown: '30s',
      gracefulStop: '30s',
    },
  },
  thresholds: {
    // Guardrails for error rate and latency.
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(90)<800', 'p(95)<1000', 'p(99)<1500'],
  },
}

function login(email, password) {
  // Authenticate and capture the session cookie token.
  const res = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({ email, password }), {
    headers: { 'Content-Type': 'application/json' },
  })

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

function createGroup(sessionToken, name) {
  // Create a group for the test run.
  const res = http.post(`${BASE_URL}/api/groups`, JSON.stringify({ name }), {
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `session=${sessionToken}`,
    },
  })

  if (res.status !== 201) {
    fail(`Create group failed (status ${res.status}).`)
  }

  return res.json()
}

function createChannel(sessionToken, groupId, name) {
  // Create a channel under the group.
  const res = http.post(`${BASE_URL}/api/groups/${groupId}/channels`, JSON.stringify({ name }), {
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `session=${sessionToken}`,
    },
  })

  if (res.status !== 201) {
    fail(`Create channel failed (status ${res.status}).`)
  }

  return res.json()
}

function safeJson(res) {
  try {
    return res.json()
  } catch (error) {
    return null
  }
}

function extractMessageIds(res) {
  const body = safeJson(res)
  if (!body || !Array.isArray(body.messages)) {
    return []
  }

  return body.messages.map(message => message?.id).filter(messageId => Number.isFinite(messageId))
}

function getMinMaxIds(ids) {
  if (!ids.length) {
    return { minId: null, maxId: null }
  }

  let minId = ids[0]
  let maxId = ids[0]

  for (const id of ids) {
    if (id < minId) {
      minId = id
    }
    if (id > maxId) {
      maxId = id
    }
  }

  return { minId, maxId }
}

export function setup() {
  // Seed auth context and set up a group + channel.
  const aliceToken = login(TEST_USERS.alice.email, TEST_USERS.alice.password)

  const group = createGroup(aliceToken, `LoadGroup-${Date.now()}`)
  const channel = createChannel(aliceToken, group.id, 'load')

  return {
    alice: { token: aliceToken },
    groupId: group.id,
    channelId: channel.id,
  }
}

export default function groupFlow(data) {
  // Send a group message as the seeded user.
  const hash = `k6-group-${__VU}-${__ITER}-${Date.now()}`
  const sendRes = http.post(
    `${BASE_URL}/api/messages/send/group`,
    JSON.stringify({
      groupId: data.groupId,
      channelId: data.channelId,
      content: `load-group-${__VU}-${__ITER}`,
      hash,
    }),
    {
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `session=${data.alice.token}`,
      },
      tags: { flow: 'group', action: 'send' },
    },
  )

  check(sendRes, {
    'group send status 201': r => r.status === 201,
  })

  // List messages for the channel to validate read performance.
  const listRes = http.get(`${BASE_URL}/api/channels/${data.channelId}/messages`, {
    headers: { Cookie: `session=${data.alice.token}` },
    tags: { flow: 'group', action: 'list' },
  })

  check(listRes, {
    'group list status 200': r => r.status === 200,
  })

  const messageIds = extractMessageIds(listRes)
  const { minId, maxId } = getMinMaxIds(messageIds)

  if (minId !== null && maxId !== null) {
    const beforeRes = http.get(`${BASE_URL}/api/channels/${data.channelId}/messages?before=${minId}`, {
      headers: { Cookie: `session=${data.alice.token}` },
      tags: { flow: 'group', action: 'list_before' },
    })

    check(beforeRes, {
      'group list before status 200': r => r.status === 200,
    })

    const afterRes = http.get(`${BASE_URL}/api/channels/${data.channelId}/messages?after=${maxId}`, {
      headers: { Cookie: `session=${data.alice.token}` },
      tags: { flow: 'group', action: 'list_after' },
    })

    check(afterRes, {
      'group list after status 200': r => r.status === 200,
    })
  }

  // Short think time to avoid unrealistically tight loops.
  sleep(1)
}
