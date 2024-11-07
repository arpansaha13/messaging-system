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
import { SocketEmitEvent } from '@shared/types'
import type {
  IReceiverEmitDelivered,
  IReceiverEmitRead,
  ISenderEmitMessage,
  ISenderEmitTyping,
  SocketOnEventPayload,
} from '@shared/types'

@WebSocketGateway()
export class ChatsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private readonly chatsService: ChatsWsService) {}

  @WebSocketServer()
  private readonly server: Server<SocketOnEventPayload>

  handleConnection(@ConnectedSocket() socket: Socket) {
    this.chatsService.handleConnect(socket)
  }

  handleDisconnect(@ConnectedSocket() socket: Socket) {
    this.chatsService.handleDisconnect(socket)
  }

  @SubscribeMessage<SocketEmitEvent>(SocketEmitEvent.SEND_MESSAGE)
  sendMessage(@MessageBody() payload: ISenderEmitMessage) {
    this.chatsService.sendMessage(payload, this.server)
  }

  @SubscribeMessage<SocketEmitEvent>(SocketEmitEvent.DELIVERED)
  handleDelivered(@MessageBody() payload: IReceiverEmitDelivered) {
    this.chatsService.handleDelivered(payload, this.server)
  }

  @SubscribeMessage<SocketEmitEvent>(SocketEmitEvent.READ)
  handleReadStatus(@MessageBody() payload: IReceiverEmitRead) {
    this.chatsService.handleRead(payload, this.server)
  }

  @SubscribeMessage<SocketEmitEvent>(SocketEmitEvent.TYPING)
  handleTyping(@MessageBody() payload: ISenderEmitTyping) {
    this.chatsService.handleTyping(payload, this.server)
  }
}
