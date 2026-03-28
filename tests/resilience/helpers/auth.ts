import { BACKEND_BASE_URL } from './config'

export async function login(email: string, password: string): Promise<string> {
  const res = await fetch(`${BACKEND_BASE_URL}/api/auth/login`, {
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
  const match = setCookie.match(/session=([^;]+)/)
  if (!match) throw new Error(`Could not parse session cookie from: ${setCookie}`)
  return match[1]
}

export async function getMe(sessionToken: string): Promise<{ id: number; globalName: string; email: string }> {
  const res = await fetch(`${BACKEND_BASE_URL}/api/users/me`, {
    headers: { Cookie: `session=${sessionToken}` },
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`GetMe failed (${res.status}): ${body}`)
  }
  return res.json()
}

export function buildSessionCookie(sessionToken: string): string {
  return `session=${sessionToken}`
}
