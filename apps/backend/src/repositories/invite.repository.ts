import AppDataSource from '../data-source'
import { Invite } from '../models/invite.entity'
import { Repository } from 'typeorm'

export class InviteRepository extends Repository<Invite> {
  constructor() {
    super(Invite, AppDataSource.createEntityManager())
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
