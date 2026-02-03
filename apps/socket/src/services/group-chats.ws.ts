import { SocketEvents } from '@shared/constants'
import { ChatsStoreService } from './chats-store'
import { RabbitMQService } from './rabbitmq.service'
import type { Server, Socket } from 'socket.io'
import type { SocketEventPayloads } from '@shared/types'

export class GroupChatsWsService {
  constructor(
    private readonly chatsStore: ChatsStoreService,
    private readonly rabbitmqService: RabbitMQService,
    private readonly server: Server,
  ) {}

  // Socket server only maintains group subscriptions for receiving events from workers.

  async handleNewGroup(payload: SocketEventPayloads.Group.EmitNewGroup, senderSocket: Socket) {
    this.chatsStore.addSocketToGroup(payload.groupId, senderSocket.id)
    senderSocket.join(payload.channels.split(','))
  }

  async handleNewChannel(payload: SocketEventPayloads.Group.EmitNewChannel) {
    const socketsInGroup = this.chatsStore.getSocketsInGroup(payload.groupId)
    const roomId = payload.channelId.toString()

    if (socketsInGroup) {
      for (const socketId of socketsInGroup) {
        const socket = this.server.to(socketId)
        socket.socketsJoin(roomId)
        socket.emit(SocketEvents.GROUP.NEW_CHANNEL, { groupId: payload.groupId })
      }
    }
  }

  async handleJoinGroup(payload: SocketEventPayloads.Group.EmitJoinGroup, senderSocket: Socket) {
    this.chatsStore.addSocketToGroup(payload.groupId, senderSocket.id)
    senderSocket.join(payload.channels.split(','))
  }
}
