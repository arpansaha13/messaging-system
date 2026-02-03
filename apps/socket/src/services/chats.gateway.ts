import { SocketEvents } from '@shared/constants'
import { PersonalChatsWsService } from './personal-chats.ws'
import { GroupChatsWsService } from './group-chats.ws'
import type { Server, Socket } from 'socket.io'
import type { SocketEventPayloads } from '@shared/types'

export class ChatsGateway {
  constructor(
    private readonly personalChatsService: PersonalChatsWsService,
    private readonly groupChatsService: GroupChatsWsService,
  ) {}

  setup(io: Server) {
    io.on('connection', (socket: Socket) => {
      this.handleConnect(socket)
      this.setupEventListeners(socket, io)
    })
  }

  private handleConnect(socket: Socket) {
    this.personalChatsService.handleConnect(socket)
    console.log(`User connected: ${socket.id}`)
  }

  private setupEventListeners(socket: Socket, io: Server) {
    socket.on(SocketEvents.PERSONAL.TYPING, (payload: SocketEventPayloads.Personal.EmitTyping) => {
      this.personalChatsService.handleTyping(payload)
    })

    socket.on(SocketEvents.PERSONAL.CHECK_ONLINE, (payload: SocketEventPayloads.Personal.EmitCheckOnline) => {
      this.personalChatsService.handleCheckOnline(payload, socket)
    })

    // Group chat events - handleNewGroup and handleJoinGroup remain for socket subscription
    // but NEW_GROUP and JOIN_GROUP are now emitted from the socket server after receiving
    // events from workers, not directly from clients

    socket.on(SocketEvents.GROUP.NEW_GROUP, (payload: SocketEventPayloads.Group.EmitNewGroup) => {
      this.groupChatsService.handleNewGroup(payload, socket)
    })

    socket.on(SocketEvents.GROUP.JOIN_GROUP, (payload: SocketEventPayloads.Group.EmitJoinGroup) => {
      this.groupChatsService.handleJoinGroup(payload, socket)
    })

    socket.on('disconnect', () => {
      this.personalChatsService.handleDisconnect(socket)
      console.log(`User disconnected: ${socket.id}`)
    })
  }
}
