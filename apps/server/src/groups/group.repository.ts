import { Injectable } from '@nestjs/common'
import { Repository, DataSource } from 'typeorm'
import { Group } from './group.entity'

@Injectable()
export class GroupRepository extends Repository<Group> {
  constructor(private readonly dataSource: DataSource) {
    super(Group, dataSource.createEntityManager())
  }
}
