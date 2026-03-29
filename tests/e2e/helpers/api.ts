import fs from 'node:fs'
import path from 'node:path'
import { getDirname } from './dirname'

const BACKEND_URL = 'http://localhost:7530'
const __dirname = getDirname(import.meta.url)

// ---------------------------------------------------------------------------
// Auth flows — used by global-setup.ts only (raw fetch, no browser)
// ---------------------------------------------------------------------------

export async function login(email: string, password: string): Promise<string> {
  const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Login failed (${res.status}): ${body}`)
  }
  const setCookie = res.headers.get('set-cookie')
  if (!setCookie) throw new Error('No Set-Cookie header in login response')
  // cookie format: "session=<token>; Path=/; ..."
  const match = setCookie.match(/session=([^;]+)/)
  if (!match) throw new Error(`Could not parse session cookie from: ${setCookie}`)
  return match[1]
}

export async function getMe(sessionToken: string): Promise<{ id: number; globalName: string; email: string }> {
  const res = await fetch(`${BACKEND_URL}/api/users/me`, {
    headers: { Cookie: `session=${sessionToken}` },
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`GetMe failed (${res.status}): ${body}`)
  }
  return res.json()
}

// ---------------------------------------------------------------------------
// storageState builder for Playwright
// ---------------------------------------------------------------------------

export function buildStorageState(sessionToken: string) {
  const expiresInSeconds = Math.floor(Date.now() / 1000) + 30 * 60
  return {
    cookies: [
      {
        name: 'session',
        value: sessionToken,
        domain: 'localhost',
        path: '/',
        expires: expiresInSeconds,
        httpOnly: true,
        secure: false,
        sameSite: 'Lax' as const,
      },
    ],
    origins: [],
  }
}

// ---------------------------------------------------------------------------
// Shared user IDs (written by global-setup, read by specs)
// ---------------------------------------------------------------------------

const USER_IDS_FILE = path.join(__dirname, '../.auth/user-ids.json')

export function loadUserIds(): Record<'alice' | 'bob' | 'charlie', number> {
  return JSON.parse(fs.readFileSync(USER_IDS_FILE, 'utf-8'))
}
