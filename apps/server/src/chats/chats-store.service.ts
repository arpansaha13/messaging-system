import { Injectable } from '@nestjs/common'
import { User } from 'src/users/user.entity'
import { Group } from 'src/groups/group.entity'
import type { Socket } from 'socket.io'

@Injectable()
export class ChatsStoreService {
  constructor() {}

  // TODO: Move this to an external cache

  // If the same user connects again it will overwrite previous data in map.
  // Which means multiple connections are not possible currently.
  // TODO: support multiple connections

  private readonly userSocketMap = new Map<User['id'], Socket['id']>()
  private readonly groupSocketMap = new Map<Group['id'], Set<Socket['id']>>()

  getClient(userId: User['id']) {
    return this.userSocketMap.get(userId)
  }

  setClient(userId: User['id'], socketId: Socket['id']) {
    return this.userSocketMap.set(userId, socketId)
  }

  deleteClient(userId: User['id']) {
    return this.userSocketMap.delete(userId)
  }

  getSocketsInGroup(groupId: Group['id']) {
    return this.groupSocketMap.get(groupId)
  }

  addSocketToGroup(groupId: Group['id'], socketId: Socket['id']) {
    if (!this.groupSocketMap.has(groupId)) {
      this.groupSocketMap.set(groupId, new Set())
    }

    const socketsSet = this.groupSocketMap.get(groupId)
    socketsSet.add(socketId)
  }

  removeSocketFromGroup(groupId: Group['id'], socketId: Socket['id']) {
    if (this.groupSocketMap.has(groupId)) {
      const socketsSet = this.groupSocketMap.get(groupId)
      socketsSet.delete(socketId)
    }
  }
}
