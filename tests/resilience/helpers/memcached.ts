import memjs from 'memjs'
import { AUTH_CACHE_ADDRESS, MEMCACHED_ADDRESS } from './config'

export type MemjsClient = ReturnType<typeof memjs.Client.create>

export function createMemcachedClient(address = MEMCACHED_ADDRESS): MemjsClient {
  return memjs.Client.create(address)
}

export function createAuthCacheClient(): MemjsClient {
  return memjs.Client.create(AUTH_CACHE_ADDRESS)
}

export async function getKey(client: MemjsClient, key: string, timeoutMs = 3_000): Promise<Buffer | null> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`memcached get timed out for key=${key}`))
    }, timeoutMs)

    client.get(key, (err: Error | null, value: Buffer | null) => {
      clearTimeout(timer)
      if (err) return reject(err)
      resolve(value ?? null)
    })
  })
}

export async function closeClient(client: MemjsClient): Promise<void> {
  await new Promise<void>((resolve) => {
    const timer = setTimeout(() => resolve(), 1_000)
    client.quit(() => {
      clearTimeout(timer)
      resolve()
    })
  })
}
