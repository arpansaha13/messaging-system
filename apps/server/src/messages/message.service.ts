import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { In, Not, MoreThanOrEqual } from 'typeorm'
// Entities
import { Room } from 'src/rooms/room.entity'
import { Message, MessageStatus } from './message.entity'
// Types
import type { Repository } from 'typeorm'

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
  ) {}

  #sameParticipantError() {
    throw new BadRequestException('Both chat participants cannot have the same user_id.')
  }
  #messageNotFound() {
    throw new NotFoundException('Message could not be found.')
  }

  async getMessageById(messageId: number): Promise<Message> {
    const message = await this.messageRepository.findOneBy({ id: messageId })
    if (message === null) this.#messageNotFound()
    return message
  }

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

  /**
   * @param firstMsgTstamp the timestamp before which the messages were cleared
   */
  getMessagesByRoomId(roomId: number, firstMsgTstamp: Date | null): Promise<Message[]> | [] {
    if (firstMsgTstamp === null) return []
    // `firstMsgTstamp` is received as a Date number in milliseconds
    return this.messageRepository.find({
      select: {
        id: true,
        content: true,
        createdAt: true,
        senderId: true,
        // Send status of all messages irrespective of whether it belongs to auth-user or not
        // This is used to show read receipts
        status: true,
      },
      where: { room: { id: roomId }, createdAt: MoreThanOrEqual(new Date(firstMsgTstamp)) },
      order: { createdAt: 'ASC' },
    })
  }

  /**
   * @param firstMsgTstamp the timestamp before which the messages were cleared
   * @returns The latest message entity. If no message is found, returns `null`.
   */
  async getLatestMsgByRoomId(roomId: number, firstMsgTstamp: Date | null): Promise<Message> | null {
    // `firstMsgTstamp` is a Date number in milliseconds
    if (firstMsgTstamp === null) return null

    return this.messageRepository.findOne({
      where: { room: { id: roomId }, createdAt: MoreThanOrEqual(new Date(firstMsgTstamp)) },
      order: { createdAt: 'DESC' },
    })
  }

  /**
   * @returns the msg_id of the newly created chat message.
   */
  async create1to1ChatMsg(room: Room, senderId: number, receiverId: number, content: string): Promise<number> {
    if (senderId === receiverId) this.#sameParticipantError()

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
