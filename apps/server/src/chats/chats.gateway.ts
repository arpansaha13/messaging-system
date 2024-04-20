import { ChatsService } from './chats.service'
import {
  MessageBody,
  ConnectedSocket,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets'
import { Ws1to1MessageDto, WsOpenedOrReadChatDto, WsTypingStateDto } from './dto/chatGateway.dto'
import type { Server, Socket } from 'socket.io'

@WebSocketGateway()
export class ChatsGateway {
  constructor(private readonly chatsService: ChatsService) {}

  @WebSocketServer()
  private readonly server: Server

  // FIXME: DTOs are not working with websocket event payloads

  @SubscribeMessage('session-connect')
  async addSession(@MessageBody('userId') userId: number, @ConnectedSocket() socket: Socket) {
    this.chatsService.addSession(userId, socket, this.server)
  }

  @SubscribeMessage('disconnect')
  handleDisconnect(@ConnectedSocket() senderSocket: Socket) {
    this.chatsService.handleDisconnect(senderSocket)
  }

  @SubscribeMessage('send-message')
  async handleEvent(@MessageBody() data: Ws1to1MessageDto, @ConnectedSocket() senderSocket: Socket) {
    this.chatsService.handleEvent(data, senderSocket, this.server)
  }

  @SubscribeMessage('opened-or-read-chat')
  async handleReadStatus(@MessageBody() data: WsOpenedOrReadChatDto, @ConnectedSocket() readerSocket: Socket) {
    this.chatsService.handleReadStatus(data, readerSocket, this.server)
  }

  @SubscribeMessage('typing-state')
  handleTyping(@MessageBody() data: WsTypingStateDto) {
    this.chatsService.handleTyping(data, this.server)
  }
}
