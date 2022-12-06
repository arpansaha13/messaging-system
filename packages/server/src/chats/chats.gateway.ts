import { MessageBody, ConnectedSocket, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets'
// Services
import { RoomService } from 'src/rooms/room.service'
import { MessageService } from 'src/messages/message.service'
import { UserToRoomService } from 'src/UserToRoom/userToRoom.service'
// DTOs
import { Ws1to1MessageDto, WsTypingStateDto } from './dto/chatGateway.dto'
// Enum
import { MessageStatus } from '../messages/message.entity'
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
  constructor(
    private readonly roomService: RoomService,
    private readonly messageService: MessageService,
    private readonly userToRoomService: UserToRoomService,
  ) {}

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
  addSession(@MessageBody('userId') userId: number, @ConnectedSocket() senderSocket: Socket) {
    // If the same user connects again it will overwrite previous data in map.
    // Which means multiple connections are not possible currently.
    // TODO: support multiple connections
    this.clients.set(userId, senderSocket.id)
  }

  @SubscribeMessage('disconnect')
  handleDisconnect(@ConnectedSocket() senderSocket: Socket) {
    const disconnectedUserId = this.#getMapKeyByValue(this.clients, senderSocket.id)
    this.clients.delete(disconnectedUserId)
  }

  @SubscribeMessage('send-message')
  async handleEvent(@MessageBody() data: Ws1to1MessageDto, @ConnectedSocket() senderSocket: Socket) {
    const receiverSocketId = this.clients.get(data.receiverId)

    if (data.roomId === null) {
      data.roomId = await this.roomService.create1to1Room(data)
    }
    const userToRoomEntity = await this.userToRoomService.getUserToRoomEntity(data.senderId, data.roomId)

    if (userToRoomEntity.firstMsgTstamp === null) {
      await this.userToRoomService.updateFirstMsgTstamp(data.senderId, data.roomId, data.ISOtime)
    }
    if (userToRoomEntity.firstMsgTstamp === null) {
      await this.userToRoomService.updateFirstMsgTstamp(data.receiverId, data.roomId, data.ISOtime)
    }
    // Store message in db
    const roomEntity = await this.roomService.getRoomById(data.roomId)
    const msgId = await this.messageService.create1to1ChatMsg(roomEntity, data.senderId, data.receiverId, data.msg)

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
    if (typeof receiverSocketId === 'undefined') return

    // Send the message to receiver
    this.server.to(receiverSocketId).emit('receive-message', {
      userId: data.senderId,
      msg: data.msg,
      ISOtime: data.ISOtime,
    })
    this.messageService.updateMsgStatus(msgId, MessageStatus.DELIVERED)
    emitMsgStatus.bind(this)(MessageStatus.DELIVERED)
  }

  @SubscribeMessage('typing-state')
  handleTyping(@MessageBody() data: WsTypingStateDto) {
    const receiverSocketId = this.clients.get(data.receiverId)
    this.server.to(receiverSocketId).emit('typing-state', data)
  }
}
