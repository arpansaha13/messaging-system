import { type DataSource, Repository } from 'typeorm'
import { Invite } from '../models/invite.entity'

export class InviteRepository extends Repository<Invite> {
  constructor(dataSource: DataSource) {
    super(Invite, dataSource.createEntityManager())
  }

  saveInvite(inv: Partial<Invite>) {
    const e = this.create(inv)
    return this.save(e)
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
