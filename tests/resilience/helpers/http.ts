import { BACKEND_BASE_URL, SOCKET_BASE_URL } from './config'

export async function backendFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${BACKEND_BASE_URL}${path}`, init)
}

export async function socketFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${SOCKET_BASE_URL}${path}`, init)
}
