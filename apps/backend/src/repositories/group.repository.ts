import AppDataSource from '../data-source'
import { Group } from '../models/group.entity'
import { Repository } from 'typeorm'

export class GroupRepository extends Repository<Group> {
  constructor() {
    super(Group, AppDataSource.createEntityManager())
  }

  saveGroup(g: Partial<Group>) {
    const e = this.create(g as any)
    return this.save(e)
  }

  findById(id: number) {
    return this.findOne({ where: { id }, relations: { founder: true } } as any)
  }
}
