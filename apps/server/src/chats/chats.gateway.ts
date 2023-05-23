import { InjectRepository } from '@nestjs/typeorm'
import { MessageBody, ConnectedSocket, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets'
// Services
import { RoomService } from 'src/rooms/room.service'
import { MessageService } from 'src/messages/message.service'
import { UserToRoomService } from 'src/UserToRoom/userToRoom.service'
// DTO
import { Ws1to1MessageDto, WsOpenedOrReadChatDto, WsTypingStateDto } from './dto/chatGateway.dto'
// Entity
import { MessageEntity, MessageStatus } from '../messages/message.entity'
// Types
import type { Server, Socket } from 'socket.io'
import type { RoomEntity } from 'src/rooms/room.entity'
import type { UserToRoom } from 'src/UserToRoom/UserToRoom.entity'
import type { Repository } from 'typeorm'

const CLIENT_ORIGIN = process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : process.env.ALLOWED_ORIGIN

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

    @InjectRepository(MessageEntity)
    private messageRepository: Repository<MessageEntity>,
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
  async addSession(@MessageBody('userId') userId: number, @ConnectedSocket() socket: Socket) {
    // If the same user connects again it will overwrite previous data in map.
    // Which means multiple connections are not possible currently.
    // TODO: support multiple connections
    const userToRooms = await this.userToRoomService.getRoomsOfUser(userId)
    const rooms = userToRooms.map(u2r => u2r.room)

    this.clients.set(userId, socket.id)

    if (rooms.length === 0) return

    // Get the userIds of those who had sent a message
    const res: { sender_id: number; room_id: number }[] = await this.messageRepository
      .createQueryBuilder('msg')
      .select(['msg.sender_id', 'msg.room_id'])
      .distinctOn(['msg.sender_id'])
      .where("msg.room_id IN (:...rooms) AND msg.status = 'SENT' AND msg.sender_id != :userId", {
        rooms: rooms.map(room => room.id),
        userId,
      })
      .getRawMany()

    // Out of these userIds, send DELIVERED status to the **online** userIds
    for (const resItem of res) {
      const socketId = this.clients.get(resItem.sender_id)
      if (socketId) {
        this.server.to(socketId).emit('all-message-status', {
          roomId: resItem.room_id,
          senderId: resItem.sender_id,
          status: MessageStatus.DELIVERED,
        })
      }
    }

    this.messageService.updateDeliveredStatus(userId, rooms)
  }
  // TODO: check if room is unarchived if the receiver is offline
  @SubscribeMessage('disconnect')
  handleDisconnect(@ConnectedSocket() senderSocket: Socket) {
    const disconnectedUserId = this.#getMapKeyByValue(this.clients, senderSocket.id)
    this.clients.delete(disconnectedUserId)
  }

  /**
   * `sender` is the user who sent the message.
   * `receiver` is the user who has received or will receive the message.
   *
   * This event will come from the sender's side.
   */
  @SubscribeMessage('send-message')
  async handleEvent(@MessageBody() data: Ws1to1MessageDto, @ConnectedSocket() senderSocket: Socket) {
    const receiverSocketId = this.clients.get(data.receiverId)
    let isNewRoom = false
    let isRevivedRoom = false
    let roomEntity: RoomEntity = null
    let senderUserToRoom: UserToRoom = null
    let receiverUserToRoom: UserToRoom | null = null

    if (data.roomId === null) isNewRoom = true

    // Create new room if it is to be a new one
    if (isNewRoom) {
      // First check if a room exists between the two users but is deleted for the sender
      // If yes, then revive that room for the sender
      const roomIdOrNull = await this.userToRoomService.get1to1RoomIdOfUsers(data.senderId, data.receiverId)
      if (roomIdOrNull !== null) {
        data.roomId = roomIdOrNull
        await this.userToRoomService.reviveRoomForUser(data.senderId, data.roomId)
        isNewRoom = false
        isRevivedRoom = true
      } else {
        const createRoomRes = await this.roomService.create1to1Room(data)
        roomEntity = createRoomRes[0]
        senderUserToRoom = createRoomRes[1]
        data.roomId = roomEntity.id
      }
    }
    // If the room already exists or is revived, update the `firstMsgTstamp`s
    if (!isNewRoom || isRevivedRoom) {
      senderUserToRoom = await this.userToRoomService.getUserToRoomEntity(data.senderId, data.roomId)
      receiverUserToRoom = await this.userToRoomService.getUserToRoomEntity(data.receiverId, data.roomId)

      if (senderUserToRoom.firstMsgTstamp === null) {
        await this.userToRoomService.updateFirstMsgTstamp(data.senderId, data.roomId, data.ISOtime)
      }
      if (receiverUserToRoom.firstMsgTstamp === null) {
        await this.userToRoomService.updateFirstMsgTstamp(data.receiverId, data.roomId, data.ISOtime)
      }
      // If receiver has deleted the room, then revive it for the receiver
      if (receiverUserToRoom.deleted) {
        await this.userToRoomService.reviveRoomForUser(data.receiverId, data.roomId)
      }
    }
    // Fetch the already existing room
    if (!isNewRoom || isRevivedRoom) {
      roomEntity = await this.roomService.getRoomById(data.roomId)
    }
    // Store message in db
    const msgId = await this.messageService.create1to1ChatMsg(roomEntity, data.senderId, data.receiverId, data.content)

    /** Inform the sender about the new message status. */
    function emitMsgStatus(status: MessageStatus) {
      this.server.to(senderSocket.id).emit('message-status', {
        roomId: roomEntity.id,
        status,
        senderId: data.senderId,
        ISOtime: data.ISOtime,
      })
    }
    if (!isNewRoom && !isRevivedRoom) {
      emitMsgStatus.bind(this)(MessageStatus.SENT)
    } else {
      // In case of a *new* or *revived* room, the details of the room are absent/removed at the client
      // So send this message back to sender along with other details
      this.server.to(senderSocket.id).emit('message-to-new-or-revived-room', {
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

  /**
   * `sender` is the user who has or had sent the message.
   * `reader` is the user who is has read the message.
   *
   * This event will come from the reader's side.
   */
  @SubscribeMessage('opened-or-read-chat')
  async handleReadStatus(@MessageBody() data: WsOpenedOrReadChatDto, @ConnectedSocket() readerSocket: Socket) {
    const senderSocketId = this.clients.get(data.senderId)
    await this.messageService.updateReadStatus(data.senderId, data.roomId)

    // If the sender is not online
    if (typeof senderSocketId === 'undefined') return

    const payload: any = {
      roomId: data.roomId,
      senderId: data.senderId,
      status: MessageStatus.READ,
    }
    if (data.ISOtime) payload.ISOtime = data.ISOtime
    const event = data.ISOtime ? 'message-status' : 'all-message-status'
    this.server.to(senderSocketId).emit(event, payload)
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
