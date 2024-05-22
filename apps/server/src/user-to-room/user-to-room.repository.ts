import { Injectable } from '@nestjs/common'
import { DataSource, type FindOptionsWhere, Repository } from 'typeorm'
import { UserToRoom } from './user-to-room.entity'

@Injectable()
export class UserToRoomRepository extends Repository<UserToRoom> {
  constructor(private dataSource: DataSource) {
    super(UserToRoom, dataSource.createEntityManager())
  }

  async getFirstMsgTstampBy(where: FindOptionsWhere<UserToRoom> | FindOptionsWhere<UserToRoom>[]) {
    const userToRoom = await this.createQueryBuilder('u2r').where(where).select('u2r.firstMsgTstamp').getOne()
    return userToRoom.firstMsgTstamp
  }
}
