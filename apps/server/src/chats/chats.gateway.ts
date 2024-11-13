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
import { ChatsWsService } from './chats-personal.ws.service'
import type { Server, Socket } from 'socket.io'
import type { SocketEventPayloads } from '@shared/types'

@WebSocketGateway()
export class ChatsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private readonly chatsService: ChatsWsService) {}

  @WebSocketServer()
  private readonly server: Server

  handleConnection(@ConnectedSocket() socket: Socket) {
    this.chatsService.handleConnect(socket)
  }

  handleDisconnect(@ConnectedSocket() socket: Socket) {
    this.chatsService.handleDisconnect(socket)
  }

  @SubscribeMessage(SocketEvents.PERSONAL.MESSAGE_SEND)
  sendMessage(@MessageBody() payload: SocketEventPayloads.Personal.EmitMessage) {
    this.chatsService.sendMessage(payload, this.server)
  }

  @SubscribeMessage(SocketEvents.PERSONAL.STATUS_DELIVERED)
  handleDelivered(@MessageBody() payload: SocketEventPayloads.Personal.EmitDelivered) {
    this.chatsService.handleDelivered(payload, this.server)
  }

  @SubscribeMessage(SocketEvents.PERSONAL.STATUS_READ)
  handleReadStatus(@MessageBody() payload: SocketEventPayloads.Personal.EmitRead) {
    this.chatsService.handleRead(payload, this.server)
  }

  @SubscribeMessage(SocketEvents.PERSONAL.TYPING)
  handleTyping(@MessageBody() payload: SocketEventPayloads.Personal.EmitTyping) {
    this.chatsService.handleTyping(payload, this.server)
  }
}
