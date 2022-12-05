import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
// Entities
import { UserEntity } from 'src/users/user.entity'
import { RoomEntity } from './room.entity'
import { UserToRoom } from 'src/UserToRoom/UserToRoom.entity'
// Types
import { Not, Repository } from 'typeorm'
import type { Ws1to1MessageDto } from 'src/chats/dto/chatGateway.dto'

@Injectable()
export class RoomService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(RoomEntity)
    private roomRepository: Repository<RoomEntity>,
    @InjectRepository(UserToRoom)
    private userToRoomRepository: Repository<UserToRoom>,
  ) {}

  #sameParticipantError() {
    throw new BadRequestException('Both room participants cannot have the same user_id.')
  }
  #roomNotFound() {
    throw new NotFoundException('No room could be found for the given users.')
  }

  getRoomById(roomId: number): Promise<RoomEntity> {
    return this.roomRepository.findOneBy({ id: roomId })
  }

  get1to1RoomsWithReceiver(authUserId: number, archived = false): Promise<UserEntity> {
    return this.userRepository.findOne({
      select: {
        rooms: {
          userToRoomId: true,
          archived: true,
          deleted: true,
          isMuted: true,
          room: {
            id: true,
            isGroup: true,
            users: {
              // Receiver user
              user: {
                id: true,
                dp: true,
                bio: true,
                displayName: true,
              },
            },
          },
        },
      },
      where: {
        id: authUserId,
        rooms: {
          archived,
          room: {
            isGroup: false,
            users: {
              user: {
                id: Not(authUserId),
              },
            },
          },
        },
      },
      relations: {
        rooms: {
          room: {
            users: {
              user: true,
            },
          },
        },
      },
      relationLoadStrategy: 'query',
    })
  }

  getReceiverIn1to1Room(authUserId: number, roomId: number): Promise<RoomEntity> {
    return this.roomRepository.findOne({
      select: {
        id: true,
        isGroup: true,
        users: {
          user: {
            id: true,
            dp: true,
            bio: true,
            displayName: true,
          },
        },
      },
      where: {
        id: roomId,
        isGroup: false,
        users: {
          user: {
            id: Not(authUserId),
          },
        },
      },
      relations: {
        users: {
          user: true,
        },
      },
      relationLoadStrategy: 'query',
    })
  }

  /**
   * @param firstMsg The first message of this chat-room received through web-sockets.
   * @returns the id of the newly created room entity.
   */
  async create1to1Room(firstMsg: Ws1to1MessageDto): Promise<number> {
    const userId1 = firstMsg.senderId
    const userId2 = firstMsg.receiverId

    if (userId1 === userId2) this.#sameParticipantError()

    const [user1, user2] = await Promise.all([
      this.userRepository.findOneBy({ id: userId1 }),
      this.userRepository.findOneBy({ id: userId2 }),
    ])
    if (user1 === null || user2 === null) throw new BadRequestException('Invalid user_id.')

    const newUserToRoom1 = new UserToRoom()
    const newUserToRoom2 = new UserToRoom()

    newUserToRoom1.user = user1
    newUserToRoom2.user = user2

    const newRoom = new RoomEntity()
    newRoom.users = [newUserToRoom1, newUserToRoom2]

    newUserToRoom1.room = newRoom
    newUserToRoom2.room = newRoom

    try {
      const [roomEntity] = await Promise.all([
        this.roomRepository.save(newRoom),
        this.userToRoomRepository.save(newUserToRoom1),
        this.userToRoomRepository.save(newUserToRoom2),
      ])
      return roomEntity.id
    } catch (error) {
      throw new InternalServerErrorException()
    }
  }
}
