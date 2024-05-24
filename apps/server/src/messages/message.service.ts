import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { isNullOrUndefined } from '@arpansaha13/utils'
import { MessageRepository } from './message.repository'
import { ChatRepository } from 'src/chats/chats.repository'
import type { Message } from './message.entity'
import type { User } from 'src/users/user.entity'

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(ChatRepository)
    private chatRepository: ChatRepository,

    @InjectRepository(MessageRepository)
    private messageRepository: MessageRepository,
  ) {}

  /**
   * Update status of **all received** messages from SENT to DELIVERED.
   * This should be done whenever a user comes online.
   * @param authUserId user_id of authorized user
   * @param roomEntities All rooms of given user
   */
  // async updateDeliveredStatus(authUserId: number, roomEntities: Room[]): Promise<void> {
  //   await this.messageRepository.update(
  //     {
  //       room: In(roomEntities.map(room => room.id)),
  //       senderId: Not(authUserId), // Those messages where this user is not the sender, i.e receiver.
  //       status: MessageStatus.SENT,
  //     },
  //     { status: MessageStatus.DELIVERED },
  //   )
  // }

  /**
   * Update status of **delivered** messages from DELIVERED to READ.
   * This should be done whenever the receiver opens the chat with unread messages.
   * @param senderId user_id whose messages are read
   * @param roomId
   */
  // async updateReadStatus(senderId: number, roomId: number): Promise<void> {
  //   await this.messageRepository.update(
  //     {
  //       room: { id: roomId },
  //       senderId,
  //       status: MessageStatus.DELIVERED,
  //     },
  //     { status: MessageStatus.READ },
  //   )
  // }
  async getMessagesByUserId(authUser: User, receiverId: User['id']): Promise<Message[]> {
    const chat = await this.chatRepository.findOne({
      where: { sender: { id: authUser.id }, receiver: { id: receiverId } },
    })

    if (isNullOrUndefined(chat)) return []

    return this.messageRepository.getMessagesByUserId(authUser.id, receiverId, chat.firstMsgTstamp)
  }

  /**
   * @returns the msg_id of the newly created chat message.
   */
  // async create1to1ChatMsg(room: Room, senderId: number, receiverId: number, content: string): Promise<number> {
  //   if (senderId === receiverId) {
  //     throw new BadRequestException('Both chat participants cannot have the same user_id.')
  //   }

  //   const newMessage = new Message()
  //   newMessage.room = room
  //   newMessage.content = content
  //   newMessage.deletedBy = {
  //     [senderId]: false,
  //     [receiverId]: false,
  //   }
  //   newMessage.senderId = senderId
  //   newMessage.status = MessageStatus.SENT

  //   try {
  //     const message = await this.messageRepository.save(newMessage)
  //     return message.id
  //   } catch (error) {
  //     throw new InternalServerErrorException()
  //   }
  // }

  /** Update status of a single message to DELIVERED or READ. */
  // updateMsgStatus(msgId: number, newStatus: MessageStatus.DELIVERED | MessageStatus.READ) {
  //   return this.messageRepository.update(msgId, { status: newStatus })
  // }
}
