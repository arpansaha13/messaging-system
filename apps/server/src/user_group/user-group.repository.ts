import { Injectable } from '@nestjs/common'
import { Repository, DataSource } from 'typeorm'
import { UserGroup } from './user-group.entity'

@Injectable()
export class UserGroupRepository extends Repository<UserGroup> {
  constructor(private dataSource: DataSource) {
    super(UserGroup, dataSource.createEntityManager())
  }
}
