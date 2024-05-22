import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common'
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm'
import { Room } from './room.entity'
import { RoomRepository } from './room.repository'
import { UserRepository } from 'src/users/user.repository'
import { UserToRoom } from 'src/user-to-room/user-to-room.entity'
import type { EntityManager } from 'typeorm'
import type { Ws1to1MessageDto } from 'src/chats/dto/chatGateway.dto'

@Injectable()
export class RoomService {
  constructor(
    @InjectEntityManager()
    private manager: EntityManager,

    @InjectRepository(UserRepository)
    private userRepository: UserRepository,

    @InjectRepository(RoomRepository)
    private roomRepository: RoomRepository,
  ) {}

  async getRoomById(roomId: number): Promise<Room> {
    const room = this.roomRepository.findOneBy({ id: roomId })
    if (room === null) throw new NotFoundException('Room could not be found.')
    return room
  }

  /**
   * A new room is created when a user (sender) sends a message to another (receiver).
   * @param firstMsg The first message of this chat-room received through web-sockets.
   * @returns the id of the newly created room entity.
   */
  async create1to1Room(firstMsg: Ws1to1MessageDto): Promise<[Room, UserToRoom, UserToRoom]> {
    const senderId = firstMsg.senderId
    const receiverId = firstMsg.receiverId

    if (senderId === receiverId) {
      throw new BadRequestException('Both room participants cannot have the same user_id.')
    }

    const [sender, receiver] = await Promise.all([
      this.userRepository.findOneBy({ id: senderId }),
      this.userRepository.findOneBy({ id: receiverId }),
    ])
    if (sender === null || receiver === null) throw new BadRequestException('Invalid user_id.')

    try {
      const [room, senderUserToRoom, receiverUserToRoom] = await this.manager.transaction(async txnManager => {
        const newSenderUserToRoom = new UserToRoom()
        newSenderUserToRoom.user = sender
        newSenderUserToRoom.firstMsgTstamp = new Date(firstMsg.ISOtime)

        const newReceiverUserToRoom = new UserToRoom()
        newReceiverUserToRoom.user = receiver
        newReceiverUserToRoom.firstMsgTstamp = new Date(firstMsg.ISOtime)

        const newRoom = new Room()
        newRoom.users = [newSenderUserToRoom, newReceiverUserToRoom]

        newSenderUserToRoom.room = newRoom
        newReceiverUserToRoom.room = newRoom

        const response = await Promise.all([
          txnManager.save(newRoom),
          txnManager.save(newSenderUserToRoom),
          txnManager.save(newReceiverUserToRoom),
        ])

        return response
      })
      return [room, senderUserToRoom, receiverUserToRoom]
    } catch (error) {
      throw new InternalServerErrorException()
    }
  }
}
