import { ChatsWsService } from './chats.ws.service'
import { MessageBody, ConnectedSocket, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets'
import type { Server, Socket } from 'socket.io'
import { SocketEmitEvent } from '@shared/types'
import type {
  IReceiverEmitDelivered,
  IReceiverEmitRead,
  ISenderEmitMessage,
  ISessionConnect,
  ISenderEmitTyping,
  SocketOnEventPayload,
} from '@shared/types'

@WebSocketGateway()
export class ChatsGateway {
  constructor(private readonly chatsService: ChatsWsService) {}

  @WebSocketServer()
  private readonly server: Server<SocketOnEventPayload>

  @SubscribeMessage<SocketEmitEvent>(SocketEmitEvent.SESSION_CONNECT)
  handleConnect(@MessageBody() payload: ISessionConnect, @ConnectedSocket() socket: Socket) {
    this.chatsService.handleConnect(payload, socket)
  }

  @SubscribeMessage('disconnect')
  handleDisconnect(@ConnectedSocket() senderSocket: Socket) {
    this.chatsService.handleDisconnect(senderSocket)
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
