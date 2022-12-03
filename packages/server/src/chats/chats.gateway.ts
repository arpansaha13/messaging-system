import {
  MessageBody,
  ConnectedSocket,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets'
// Services
import { ChatService } from './chat.service'
// DTOs
import { Ws1to1MessageDto } from './dtos/chatGateway.dto'
// Enum
import { MessageStatus } from './message.entity'
// Constants
import { CLIENT_ORIGIN } from 'src/constants'
// Types
import type { Server, Socket } from 'socket.io'

@WebSocketGateway({
  cors: {
    origin: CLIENT_ORIGIN,
  },
})
export class ChatsGateway {
  constructor(private readonly chatService: ChatService) {}

  @WebSocketServer()
  server: Server

  /** A map of all clients (user_id's) to their client socket id's. */
  clients = new Map<number, string>()

  #getMapKeyByValue(map: Map<number, string>, searchValue: string): number {
    for (const [key, value] of map.entries()) {
      if (value === searchValue) return key
    }
  }

  // FIXME: DTOs are not working with websocket event payloads

  @SubscribeMessage('session-connect')
  addSession(
    @MessageBody('userId') userId: number,
    @ConnectedSocket() senderSocket: Socket,
  ) {
    // If the same user connects again it will overwrite previous data in map.
    // Which means multiple connections are not possible currently.
    // TODO: support multiple connections
    this.clients.set(userId, senderSocket.id)
  }

  @SubscribeMessage('disconnect')
  handleDisconnect(@ConnectedSocket() senderSocket: Socket) {
    const disconnectedUserId = this.#getMapKeyByValue(
      this.clients,
      senderSocket.id,
    )
    this.clients.delete(disconnectedUserId)
  }

  @SubscribeMessage('send-message')
  async handleEvent(
    @MessageBody() data: Ws1to1MessageDto,
    @ConnectedSocket() senderSocket: Socket,
  ) {
    const receiverClientId = this.clients.get(data.receiverId)

    // TODO: Try to save this info so that we don't run this api again and again
    const chatEntity = await this.chatService.getChatEntityByUserId(
      data.senderId,
      data.receiverId,
      true,
    )
    let chatId = chatEntity !== null ? chatEntity.id : null

    if (chatEntity === null) {
      chatId = await this.chatService.create1to1Chat(data)
    }
    // Store message in db
    const msgId = await this.chatService.create1to1ChatMsg(
      chatId,
      data.senderId,
      data.receiverId,
      data.msg,
    )

    /** Inform the sender about the new message status. */
    function emitMsgStatus(status: MessageStatus) {
      this.server.to(senderSocket.id).emit('message-status', {
        status,
        /** The chats are mapped with receiver user_id in client-side. */
        receiverId: data.receiverId,
        ISOtime: data.ISOtime,
      })
    }

    emitMsgStatus.bind(this)(MessageStatus.SENT)

    // If the receiver is not online
    if (typeof receiverClientId === 'undefined') return

    // Send the message to receiver
    this.server.to(receiverClientId).emit('receive-message', {
      userId: data.senderId,
      msg: data.msg,
      ISOtime: data.ISOtime,
    })
    this.chatService.updateMsgStatus(msgId, MessageStatus.DELIVERED)
    emitMsgStatus.bind(this)(MessageStatus.DELIVERED)
  }
}
