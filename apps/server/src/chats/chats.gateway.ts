import { ChatsWsService } from './chats.ws.service'
import { MessageBody, ConnectedSocket, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets'
import type { Server, Socket } from 'socket.io'
import type {
  IReceiverEmitDelivered,
  IReceiverEmitRead,
  ISenderEmitMessage,
  ISessionConnect,
  ISenderEmitTyping,
  SocketEmitEvent,
  SocketOnEventPayload,
} from '@shared/types'

@WebSocketGateway()
export class ChatsGateway {
  constructor(private readonly chatsService: ChatsWsService) {}

  @WebSocketServer()
  private readonly server: Server<SocketOnEventPayload>

  @SubscribeMessage<SocketEmitEvent>('session-connect')
  handleConnect(@MessageBody() payload: ISessionConnect, @ConnectedSocket() socket: Socket) {
    this.chatsService.handleConnect(payload, socket)
  }

  @SubscribeMessage('disconnect')
  handleDisconnect(@ConnectedSocket() senderSocket: Socket) {
    this.chatsService.handleDisconnect(senderSocket)
  }

  @SubscribeMessage<SocketEmitEvent>('send-message')
  sendMessage(@MessageBody() payload: ISenderEmitMessage) {
    this.chatsService.sendMessage(payload, this.server)
  }

  @SubscribeMessage<SocketEmitEvent>('delivered')
  handleDelivered(@MessageBody() payload: IReceiverEmitDelivered) {
    this.chatsService.handleDelivered(payload, this.server)
  }

  @SubscribeMessage<SocketEmitEvent>('read')
  handleReadStatus(@MessageBody() payload: IReceiverEmitRead) {
    this.chatsService.handleRead(payload, this.server)
  }

  @SubscribeMessage<SocketEmitEvent>('typing')
  handleTyping(@MessageBody() payload: ISenderEmitTyping) {
    this.chatsService.handleTyping(payload, this.server)
  }
}
