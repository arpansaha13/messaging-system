import { DataSource, Repository } from 'typeorm'
import AppDataSource from '../data-source'
import { UnverifiedUser } from '../models/unverified-user.entity'

export class UnverifiedUserRepository extends Repository<UnverifiedUser> {
  constructor() {
    super(UnverifiedUser, AppDataSource.createEntityManager())
  }

  existsByHash(hash: string) {
    return this.exist({ where: { hash } })
  }

  findByHash(hash: string) {
    return this.findOne({ where: { hash } })
  }

  deleteByHash(hash: string) {
    return this.delete({ hash } as any)
  }
}
