import { type DataSource, Repository } from 'typeorm'
import { Invite } from '../models/invite.entity'

export class InviteRepository extends Repository<Invite> {
  constructor(dataSource: DataSource) {
    super(Invite, dataSource.createEntityManager())
  }

  findByHash(hash: string) {
    return this.findOne({ where: { hash } })
  }

  findByHashWithGroup(hash: string) {
    return this.findOne({
      where: { hash },
      relations: { group: true },
    })
  }
}
