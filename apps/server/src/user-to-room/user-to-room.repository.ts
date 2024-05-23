import { Injectable } from '@nestjs/common'
import { DataSource, type FindOptionsWhere, Repository, type UpdateResult } from 'typeorm'
import { isNullOrUndefined } from '@arpansaha13/utils'
import { UserToRoom } from './user-to-room.entity'
import type { User } from 'src/users/user.entity'
import type { Room } from 'src/rooms/room.entity'

@Injectable()
export class UserToRoomRepository extends Repository<UserToRoom> {
  constructor(private dataSource: DataSource) {
    super(UserToRoom, dataSource.createEntityManager())
  }

  async getFirstMsgTstampBy(where: FindOptionsWhere<UserToRoom> | FindOptionsWhere<UserToRoom>[]) {
    const userToRoom = await this.createQueryBuilder('u2r').select('u2r.firstMsgTstamp').where(where).getOne()
    return userToRoom.firstMsgTstamp
  }

  /**
   * Finds the room_id of a one-to-one chat-room for the two given user_id's.
   * Returns `null` if no such room exists.
   */
  async get1to1RoomIdOfUsers(userId1: User['id'], userId2: User['id']): Promise<Room['id'] | null> {
    const res = await this.createQueryBuilder('u2r')
      .select('u2r.room_id')
      .innerJoin(UserToRoom, 'r2u', 'u2r.room_id = r2u.room_id')
      .where('u2r.user_id = :userId1', { userId1 })
      .andWhere('r2u.user_id = :userId2', { userId2 })
      .getRawOne()

    return isNullOrUndefined(res) ? null : res.room_id
  }

  updateUserToRoom(userId: User['id'], roomId: Room['id'], partialEntity: Partial<UserToRoom>): Promise<UpdateResult> {
    return this.update(
      {
        user: { id: userId },
        room: { id: roomId },
      },
      partialEntity,
    )
  }
}
