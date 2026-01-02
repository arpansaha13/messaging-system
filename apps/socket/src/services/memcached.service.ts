import memjs from 'memjs'

export class MemcachedService {
  private readonly client: memjs.Client

  constructor() {
    const host = process.env.MEMCACHED_HOST || 'memcached'
    const port = process.env.MEMCACHED_PORT || '11211'
    this.client = memjs.Client.create(`${host}:${port}`)
  }

  async setOnline(userId: number, ttl: number): Promise<boolean> {
    try {
      const key = this.getKey(userId)
      const result = await this.client.set(key, '1', { expires: ttl })
      return result !== null
    } catch (error) {
      console.error('Error setting user online status:', error)
      return false
    }
  }

  async isOnline(userId: number): Promise<boolean> {
    try {
      const key = this.getKey(userId)
      const result = await this.client.get(key)
      return result !== null && result.value !== null
    } catch (error) {
      console.error('Error checking user online status:', error)
      return false
    }
  }

  async setBatchOnline(userIds: number[], ttl: number): Promise<void> {
    try {
      const promises = userIds.map(userId => this.setOnline(userId, ttl))
      await Promise.all(promises)
    } catch (error) {
      console.error('Error setting batch online status:', error)
    }
  }

  async getBatchOnlineStatus(userIds: number[]): Promise<Map<number, boolean>> {
    const statusMap = new Map<number, boolean>()
    try {
      const keys = userIds.map(userId => this.getKey(userId))
      const results = await Promise.all(keys.map(key => this.client.get(key)))

      userIds.forEach((userId, index) => {
        const result = results[index]
        const isOnline = result !== null && result.value !== null
        statusMap.set(userId, isOnline)
      })
    } catch (error) {
      console.error('Error getting batch online status:', error)
      // Set all to false on error
      userIds.forEach(userId => statusMap.set(userId, false))
    }
    return statusMap
  }

  private getKey(userId: number): string {
    return `user:online:${userId}`
  }

  async setUserServerMapping(userId: number, serverId: string): Promise<boolean> {
    try {
      const key = `user:server:${userId}`
      const result = await this.client.set(key, serverId, { expires: 3600 }) // 1 hour TTL
      return result !== null
    } catch (error) {
      console.error('Error setting user-server mapping:', error)
      return false
    }
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

  async deleteUserServerMapping(userId: number): Promise<boolean> {
    try {
      const key = `user:server:${userId}`
      const result = await this.client.delete(key)
      return result !== null
    } catch (error) {
      console.error('Error deleting user-server mapping:', error)
      return false
    }
  }
}
