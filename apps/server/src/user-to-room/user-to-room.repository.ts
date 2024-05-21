import { Injectable } from '@nestjs/common'
import { DataSource, Repository } from 'typeorm'
import { UserToRoom } from './user-to-room.entity'

@Injectable()
export class UserToRoomRepository extends Repository<UserToRoom> {
  constructor(private dataSource: DataSource) {
    super(UserToRoom, dataSource.createEntityManager())
  }
}
