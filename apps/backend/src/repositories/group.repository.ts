import { type DataSource, Repository } from 'typeorm'
import { Group } from '../models/group.entity'

export class GroupRepository extends Repository<Group> {
  constructor(dataSource: DataSource) {
    super(Group, dataSource.createEntityManager())
  }

  findById(id: number) {
    return this.findOne({ where: { id }, relations: { founder: true } })
  }
}
