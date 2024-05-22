import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { In, Not } from 'typeorm'
import { Room } from 'src/rooms/room.entity'
import { Message, MessageStatus } from './message.entity'
import { MessageRepository } from './message.repository'
import { UserToRoomRepository } from 'src/user-to-room/user-to-room.repository'
import type { User } from 'src/users/user.entity'

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(UserToRoomRepository)
    private userToRoomRepository: UserToRoomRepository,

    @InjectRepository(MessageRepository)
    private messageRepository: MessageRepository,
  ) {}

  /**
   * Update status of **all received** messages from SENT to DELIVERED.
   * This should be done whenever a user comes online.
   * @param authUserId user_id of authorized user
   * @param roomEntities All rooms of given user
   */
  async updateDeliveredStatus(authUserId: number, roomEntities: Room[]): Promise<void> {
    await this.messageRepository.update(
      {
        room: In(roomEntities.map(room => room.id)),
        senderId: Not(authUserId), // Those messages where this user is not the sender, i.e receiver.
        status: MessageStatus.SENT,
      },
      { status: MessageStatus.DELIVERED },
    )
  }

  /**
   * Update status of **delivered** messages from DELIVERED to READ.
   * This should be done whenever the receiver opens the chat with unread messages.
   * @param senderId user_id whose messages are read
   * @param roomId
   */
  async updateReadStatus(senderId: number, roomId: number): Promise<void> {
    await this.messageRepository.update(
      {
        room: { id: roomId },
        senderId,
        status: MessageStatus.DELIVERED,
      },
      { status: MessageStatus.READ },
    )
  }

  async getMessagesByRoomId(authUser: User, roomId: number): Promise<Message[]> {
    /** The timestamp before which the messages were cleared */
    const firstMsgTstamp = await this.userToRoomRepository.getFirstMsgTstampBy({
      user: { id: authUser.id },
      room: { id: roomId },
    })

    if (firstMsgTstamp === null) return []

    return this.messageRepository.getMessagesByRoomId(roomId, firstMsgTstamp)
  }

  /**
   * @returns the msg_id of the newly created chat message.
   */
  async create1to1ChatMsg(room: Room, senderId: number, receiverId: number, content: string): Promise<number> {
    if (senderId === receiverId) {
      throw new BadRequestException('Both chat participants cannot have the same user_id.')
    }

    const newMessage = new Message()
    newMessage.room = room
    newMessage.content = content
    newMessage.deletedBy = {
      [senderId]: false,
      [receiverId]: false,
    }
    newMessage.senderId = senderId
    newMessage.status = MessageStatus.SENT

    try {
      const message = await this.messageRepository.save(newMessage)
      return message.id
    } catch (error) {
      throw new InternalServerErrorException()
    }
  }

  /** Update status of a single message to DELIVERED or READ. */
  updateMsgStatus(msgId: number, newStatus: MessageStatus.DELIVERED | MessageStatus.READ) {
    return this.messageRepository.update(msgId, { status: newStatus })
  }
}
