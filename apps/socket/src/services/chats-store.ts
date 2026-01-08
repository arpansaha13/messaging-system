export class ChatsStoreService {
  // If the same user connects again it will overwrite previous data in map.
  // Which means multiple connections are not possible currently.
  // TODO: support multiple connections

  private readonly userSocketMap = new Map<number, string>()
  private readonly groupSocketMap = new Map<number, Set<string>>()
  private readonly pingTrackingSet = new Set<number>()

  // Track user channels and groups with reference counting
  private readonly userChannelsMap = new Map<number, Set<number>>() // userId -> Set<channelIds>
  private readonly userGroupsMap = new Map<number, Set<number>>() // userId -> Set<groupIds>
  private readonly channelRefCount = new Map<number, number>() // channelId -> count of users subscribed
  private readonly groupRefCount = new Map<number, number>() // groupId -> count of users subscribed

  getClient(userId: number): string | undefined {
    return this.userSocketMap.get(userId)
  }

  setClient(userId: number, socketId: string): void {
    this.userSocketMap.set(userId, socketId)
  }

  deleteClient(userId: number): boolean {
    return this.userSocketMap.delete(userId)
  }

  getSocketsInGroup(groupId: number): Set<string> | undefined {
    return this.groupSocketMap.get(groupId)
  }

  addSocketToGroup(groupId: number, socketId: string): void {
    if (!this.groupSocketMap.has(groupId)) {
      this.groupSocketMap.set(groupId, new Set())
    }

    const socketsSet = this.groupSocketMap.get(groupId)
    socketsSet.add(socketId)
  }

  removeSocketFromGroup(groupId: number, socketId: string): void {
    if (this.groupSocketMap.has(groupId)) {
      const socketsSet = this.groupSocketMap.get(groupId)
      socketsSet.delete(socketId)
    }
  }

  trackPing(userId: number): void {
    this.pingTrackingSet.add(userId)
  }

  getAndClearPingTrackingSet(): number[] {
    const userIds = Array.from(this.pingTrackingSet)
    this.pingTrackingSet.clear()
    return userIds
  }

  /** Add user channels with reference counting */
  addUserChannels(userId: number, channelIds: number[]): void {
    const channels = new Set(channelIds)
    this.userChannelsMap.set(userId, channels)

    // Increment reference count for each channel
    for (const channelId of channelIds) {
      const currentCount = this.channelRefCount.get(channelId) || 0
      this.channelRefCount.set(channelId, currentCount + 1)
    }
  }

  /** Add user groups with reference counting */
  addUserGroups(userId: number, groupIds: number[]): void {
    const groups = new Set(groupIds)
    this.userGroupsMap.set(userId, groups)

    // Increment reference count for each group
    for (const groupId of groupIds) {
      const currentCount = this.groupRefCount.get(groupId) || 0
      this.groupRefCount.set(groupId, currentCount + 1)
    }
  }

  getUserChannels(userId: number): number[] {
    const channels = this.userChannelsMap.get(userId)
    return channels ? Array.from(channels) : []
  }

  getUserGroups(userId: number): number[] {
    const groups = this.userGroupsMap.get(userId)
    return groups ? Array.from(groups) : []
  }

  /** Returns channels and groups to unbind when user disconnects */
  removeUserChannelsAndGroups(userId: number): { channelIds: number[]; groupIds: number[] } {
    const channelIds = this.getUserChannels(userId)
    const groupIds = this.getUserGroups(userId)

    // Decrement reference counts
    for (const channelId of channelIds) {
      const currentCount = this.channelRefCount.get(channelId) || 0
      if (currentCount > 1) {
        this.channelRefCount.set(channelId, currentCount - 1)
      } else {
        this.channelRefCount.delete(channelId)
      }
    }

    for (const groupId of groupIds) {
      const currentCount = this.groupRefCount.get(groupId) || 0
      if (currentCount > 1) {
        this.groupRefCount.set(groupId, currentCount - 1)
      } else {
        this.groupRefCount.delete(groupId)
      }
    }

    // Remove user from maps
    this.userChannelsMap.delete(userId)
    this.userGroupsMap.delete(userId)

    return { channelIds, groupIds }
  }

  /** Check if a channel has any subscribers */
  hasChannelSubscribers(channelId: number): boolean {
    return (this.channelRefCount.get(channelId) || 0) > 0
  }

  /** Check if a group has any subscribers  */
  hasGroupSubscribers(groupId: number): boolean {
    return (this.groupRefCount.get(groupId) || 0) > 0
  }
}
