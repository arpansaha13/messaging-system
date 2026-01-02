import memjs from 'memjs'

export class MemcachedService {
  private readonly client: memjs.Client

  constructor() {
    const host = process.env.MEMCACHED_HOST || 'memcached'
    const port = process.env.MEMCACHED_PORT || '11211'
    this.client = memjs.Client.create(`${host}:${port}`)
  }

  async getUserServerMapping(userId: number): Promise<string | null> {
    try {
      const key = `user:server:${userId}`
      const result = await this.client.get(key)
      return result?.value?.toString() || null
    } catch (error) {
      console.error('Error getting user-server mapping:', error)
      return null
    }
  }
}
