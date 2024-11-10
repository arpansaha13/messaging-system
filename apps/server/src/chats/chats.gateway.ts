import { ChatsWsService } from './chats.ws.service'
import {
  MessageBody,
  ConnectedSocket,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  type OnGatewayConnection,
  type OnGatewayDisconnect,
} from '@nestjs/websockets'
import type { Server, Socket } from 'socket.io'
import { SocketEvent } from '@shared/types'
import type { IReceiverEmitDelivered, IReceiverEmitRead, ISenderEmitMessage, ISenderEmitTyping } from '@shared/types'

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

  @SubscribeMessage<SocketEvent>(SocketEvent.SEND_MESSAGE)
  sendMessage(@MessageBody() payload: ISenderEmitMessage) {
    this.chatsService.sendMessage(payload, this.server)
  }

  @SubscribeMessage<SocketEvent>(SocketEvent.DELIVERED)
  handleDelivered(@MessageBody() payload: IReceiverEmitDelivered) {
    this.chatsService.handleDelivered(payload, this.server)
  }

  @SubscribeMessage<SocketEvent>(SocketEvent.READ)
  handleReadStatus(@MessageBody() payload: IReceiverEmitRead) {
    this.chatsService.handleRead(payload, this.server)
  }

  @SubscribeMessage<SocketEvent>(SocketEvent.TYPING)
  handleTyping(@MessageBody() payload: ISenderEmitTyping) {
    this.chatsService.handleTyping(payload, this.server)
  }
}
