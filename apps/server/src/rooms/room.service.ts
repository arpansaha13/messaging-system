import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common'
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm'
import { Room } from './room.entity'
import { User } from 'src/users/user.entity'
import { UserToRoom } from 'src/UserToRoom/UserToRoom.entity'
import type { EntityManager, Repository } from 'typeorm'
import type { Ws1to1MessageDto } from 'src/chats/dto/chatGateway.dto'

@Injectable()
export class RoomService {
  constructor(
    @InjectEntityManager()
    private manager: EntityManager,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Room)
    private roomRepository: Repository<Room>,
  ) {}

  #sameParticipantError() {
    throw new BadRequestException('Both room participants cannot have the same user_id.')
  }
  #roomNotFound() {
    throw new NotFoundException('Room could not be found.')
  }

  async getRoomById(roomId: number): Promise<Room> {
    const room = this.roomRepository.findOneBy({ id: roomId })
    if (room === null) this.#roomNotFound()
    return room
  }

  async getUsersOfRoomById(roomId: number): Promise<User[]> {
    const room = await this.roomRepository.findOne({
      select: {
        id: true,
        users: {
          userToRoomId: true,
          user: {
            id: true,
            dp: true,
            bio: true,
            displayName: true,
          },
        },
      },
      where: { id: roomId },
      relations: {
        users: {
          user: true,
        },
      },
      relationLoadStrategy: 'query',
    })
    if (room === null) this.#roomNotFound()
    return room.users.map(e => e.user)
  }

  /**
   * A new room is created when a user (sender) sends a message to another (receiver).
   * @param firstMsg The first message of this chat-room received through web-sockets.
   * @returns the id of the newly created room entity.
   */
  async create1to1Room(firstMsg: Ws1to1MessageDto): Promise<[Room, UserToRoom, UserToRoom]> {
    const senderId = firstMsg.senderId
    const receiverId = firstMsg.receiverId

    if (senderId === receiverId) this.#sameParticipantError()

    const [sender, receiver] = await Promise.all([
      this.userRepository.findOneBy({ id: senderId }),
      this.userRepository.findOneBy({ id: receiverId }),
    ])
    if (sender === null || receiver === null) throw new BadRequestException('Invalid user_id.')

    try {
      const [room, senderUserToRoom, receiverUserToRoom] = await this.manager.transaction(async txnManager => {
        const newSenderUserToRoom = new UserToRoom()
        const newReceiverUserToRoom = new UserToRoom()

        newSenderUserToRoom.user = sender
        newReceiverUserToRoom.user = receiver

        newSenderUserToRoom.firstMsgTstamp = new Date(firstMsg.ISOtime)
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
