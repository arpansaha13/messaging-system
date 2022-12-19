import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { In, Not, MoreThanOrEqual } from 'typeorm'
// Entities
import { RoomEntity } from 'src/rooms/room.entity'
import { MessageEntity, MessageStatus } from './message.entity'
// Types
import type { Repository } from 'typeorm'

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(MessageEntity)
    private messageRepository: Repository<MessageEntity>,
  ) {}

  #sameParticipantError() {
    throw new BadRequestException('Both chat participants cannot have the same user_id.')
  }
  #messageNotFound() {
    throw new NotFoundException('Message could not be found.')
  }

  async getMessageById(messageId: number): Promise<MessageEntity> {
    const messageEntity = await this.messageRepository.findOneBy({ id: messageId })
    if (messageEntity === null) this.#messageNotFound()
    return messageEntity
  }

  /**
   * Update status of **all received** messages from SENT to DELIVERED.
   * This should be done whenever a user comes online.
   * @param authUserId user_id of authorized user
   * @param roomEntities All rooms of given user
   */
  // TODO: Update msg status when receiver comes online while sender is already online (real-time)
  async updateDeliveredStatus(authUserId: number, roomEntities: RoomEntity[]): Promise<void> {
    await this.messageRepository.update(
      {
        room: In(roomEntities.map(room => room.id)),
        senderId: Not(authUserId), // Those messages where this user is not the sender, i.e receiver.
        status: MessageStatus.SENT,
      },
      {
        status: MessageStatus.DELIVERED,
      },
    )
  }

  /**
   * @param firstMsgTstamp the timestamp before which the messages were cleared
   */
  getMessagesByRoomId(roomId: number, firstMsgTstamp: Date | null): Promise<MessageEntity[]> | [] {
    if (firstMsgTstamp === null) return []
    // `firstMsgTstamp` is received as a Date number in milliseconds
    return this.messageRepository.find({
      where: { room: { id: roomId }, createdAt: MoreThanOrEqual(new Date(firstMsgTstamp)) },
      order: { createdAt: 'ASC' },
    })
  }

  /**
   * @param firstMsgTstamp the timestamp before which the messages were cleared
   * @returns The latest message entity. If no message is found, returns `null`.
   */
  async getLatestMsgByRoomId(roomId: number, firstMsgTstamp: Date | null): Promise<MessageEntity> | null {
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
  async create1to1ChatMsg(room: RoomEntity, senderId: number, receiverId: number, content: string): Promise<number> {
    if (senderId === receiverId) this.#sameParticipantError()

    const newMessage = new MessageEntity()
    newMessage.room = room
    newMessage.content = content
    newMessage.deletedBy = {
      [senderId]: false,
      [receiverId]: false,
    }
    newMessage.senderId = senderId
    newMessage.status = MessageStatus.SENT

    try {
      const messageEntity = await this.messageRepository.save(newMessage)
      return messageEntity.id
    } catch (error) {
      throw new InternalServerErrorException()
    }
  }

  /** Update status of a single message to DELIVERED or READ. */
  updateMsgStatus(msgId: number, newStatus: MessageStatus.DELIVERED | MessageStatus.READ) {
    return this.messageRepository.update(msgId, { status: newStatus })
  }
}
