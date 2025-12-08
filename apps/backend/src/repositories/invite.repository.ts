import { type DataSource, Repository } from 'typeorm'
import { Invite } from '../models/invite.entity'

export class InviteRepository extends Repository<Invite> {
  constructor(dataSource: DataSource) {
    super(Invite, dataSource.createEntityManager())
  }

  saveInvite(inv: Partial<Invite>) {
    const e = this.create(inv as any)
    return this.save(e)
  }

  findByHash(hash: string) {
    return this.findOne({ where: { hash } } as any)
  }

  findByHashWithGroup(hash: string) {
    return this.findOne({
      where: { hash },
      relations: { group: true },
    } as any)
  }
}
