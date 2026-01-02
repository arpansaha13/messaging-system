export class ChatsStoreService {
  // TODO: Move this to an external cache

  // If the same user connects again it will overwrite previous data in map.
  // Which means multiple connections are not possible currently.
  // TODO: support multiple connections

  private readonly userSocketMap = new Map<number, string>()
  private readonly groupSocketMap = new Map<number, Set<string>>()
  private readonly pingTrackingSet = new Set<number>()

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

    const socketsSet = this.groupSocketMap.get(groupId)!
    socketsSet.add(socketId)
  }

  removeSocketFromGroup(groupId: number, socketId: string): void {
    if (this.groupSocketMap.has(groupId)) {
      const socketsSet = this.groupSocketMap.get(groupId)!
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
}
