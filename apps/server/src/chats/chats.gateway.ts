import {
  MessageBody,
  ConnectedSocket,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  type OnGatewayConnection,
  type OnGatewayDisconnect,
} from '@nestjs/websockets'
import { SocketEvents } from '@shared/constants'
import { GroupChatsWsService } from './group-chats.ws.service'
import { PersonalChatsWsService } from './personal-chats.ws.service'
import type { Server, Socket } from 'socket.io'
import type { SocketEventPayloads } from '@shared/types'

@WebSocketGateway()
export class ChatsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly personalChatsService: PersonalChatsWsService,
    private readonly groupChatsService: GroupChatsWsService,
  ) {}

  @WebSocketServer()
  private readonly server: Server

  handleConnection(@ConnectedSocket() socket: Socket) {
    this.personalChatsService.handleConnect(socket)
  }

  handleDisconnect(@ConnectedSocket() socket: Socket) {
    this.personalChatsService.handleDisconnect(socket)
  }

  @SubscribeMessage(SocketEvents.PERSONAL.MESSAGE_SEND)
  sendMessage(@MessageBody() payload: SocketEventPayloads.Personal.EmitMessage) {
    this.personalChatsService.sendMessage(payload, this.server)
  }

  @SubscribeMessage(SocketEvents.PERSONAL.STATUS_DELIVERED)
  handleDelivered(@MessageBody() payload: SocketEventPayloads.Personal.EmitDelivered) {
    this.personalChatsService.handleDelivered(payload, this.server)
  }

  @SubscribeMessage(SocketEvents.PERSONAL.STATUS_READ)
  handleReadStatus(@MessageBody() payload: SocketEventPayloads.Personal.EmitRead) {
    this.personalChatsService.handleRead(payload, this.server)
  }

  @SubscribeMessage(SocketEvents.PERSONAL.TYPING)
  handleTyping(@MessageBody() payload: SocketEventPayloads.Personal.EmitTyping) {
    this.personalChatsService.handleTyping(payload, this.server)
  }

  @SubscribeMessage(SocketEvents.GROUP.MESSAGE_SEND)
  sendGroupMessage(@MessageBody() payload: SocketEventPayloads.Group.EmitMessage, @ConnectedSocket() socket: Socket) {
    this.groupChatsService.sendMessage(payload, socket)
  }
}
