import { type DataSource, Repository } from 'typeorm'
import { Group } from '../models/group.entity'

export class GroupRepository extends Repository<Group> {
  constructor(dataSource: DataSource) {
    super(Group, dataSource.createEntityManager())
  }

  saveGroup(g: Partial<Group>) {
    const e = this.create(g)
    return this.save(e)
  }

  findById(id: number) {
    return this.findOne({ where: { id }, relations: { founder: true } })
  }
}
