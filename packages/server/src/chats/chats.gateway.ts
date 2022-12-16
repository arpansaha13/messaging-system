import { MessageBody, ConnectedSocket, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets'
// Services
import { RoomService } from 'src/rooms/room.service'
import { MessageService } from 'src/messages/message.service'
import { UserToRoomService } from 'src/UserToRoom/userToRoom.service'
// DTOs
import { Ws1to1MessageDto, WsTypingStateDto } from './dto/chatGateway.dto'
// Enum
import { MessageStatus } from '../messages/message.entity'
// Types
import type { Server, Socket } from 'socket.io'
import type { RoomEntity } from 'src/rooms/room.entity'
import type { UserToRoom } from 'src/UserToRoom/UserToRoom.entity'

const CLIENT_ORIGIN = 'http://localhost:3000'

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
    let isNewRoom = false
    let roomEntity: RoomEntity = null
    let senderUserToRoom: UserToRoom = null
    let receiverUserToRoom: UserToRoom | null = null

    if (data.roomId === null) isNewRoom = true

    // Create new room if it is to be a new one
    if (isNewRoom) {
      const createRoomRes = await this.roomService.create1to1Room(data)
      roomEntity = createRoomRes[0]
      senderUserToRoom = createRoomRes[1]
      data.roomId = roomEntity.id
    }
    // If the room already exists, update the `firstMsgTstamp`s
    if (!isNewRoom) {
      senderUserToRoom = await this.userToRoomService.getUserToRoomEntity(data.senderId, data.roomId)
      receiverUserToRoom = await this.userToRoomService.getUserToRoomEntity(data.receiverId, data.roomId)

      if (senderUserToRoom.firstMsgTstamp === null) {
        await this.userToRoomService.updateFirstMsgTstamp(data.senderId, data.roomId, data.ISOtime)
      }
      if (receiverUserToRoom.firstMsgTstamp === null) {
        await this.userToRoomService.updateFirstMsgTstamp(data.receiverId, data.roomId, data.ISOtime)
      }
    }
    // Fetch the already existing room
    if (!isNewRoom) {
      roomEntity = await this.roomService.getRoomById(data.roomId)
    }
    // Store message in db
    const msgId = await this.messageService.create1to1ChatMsg(roomEntity, data.senderId, data.receiverId, data.content)

    /** Inform the sender about the new message status. */
    function emitMsgStatus(status: MessageStatus) {
      this.server.to(senderSocket.id).emit('message-status', {
        roomId: roomEntity.id,
        status,
        ISOtime: data.ISOtime,
      })
    }
    if (!isNewRoom) {
      emitMsgStatus.bind(this)(MessageStatus.SENT)
    } else {
      // If it is a new room then send this message back to sender along with other details
      this.server.to(senderSocket.id).emit('send-message-new-room', {
        userToRoomId: senderUserToRoom.userToRoomId,
        room: {
          id: roomEntity.id,
          archived: senderUserToRoom.archived,
          deleted: senderUserToRoom.deleted,
          isGroup: roomEntity.isGroup,
          muted: senderUserToRoom.isMuted,
        },
        latestMsg: {
          content: data.content,
          createdAt: data.ISOtime,
          senderId: data.senderId,
          status: MessageStatus.SENT,
        },
      })
    }

    // If the receiver is not online
    if (typeof receiverSocketId === 'undefined') return

    // Send the message to receiver
    this.server.to(receiverSocketId).emit('receive-message', {
      roomId: roomEntity.id,
      senderId: data.senderId,
      content: data.content,
      ISOtime: data.ISOtime,
    })

    this.messageService.updateMsgStatus(msgId, MessageStatus.DELIVERED)
    emitMsgStatus.bind(this)(MessageStatus.DELIVERED)
  }

  @SubscribeMessage('typing-state')
  handleTyping(@MessageBody() data: WsTypingStateDto) {
    const receiverSocketId = this.clients.get(data.receiverId)
    this.server.to(receiverSocketId).emit('typing-state', {
      roomId: data.roomId,
      isTyping: data.isTyping,
    })
  }
}
