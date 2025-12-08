import { type DataSource, Repository } from 'typeorm'
import { UnverifiedUser } from '../models/unverified-user.entity'

export class UnverifiedUserRepository extends Repository<UnverifiedUser> {
  constructor(dataSource: DataSource) {
    super(UnverifiedUser, dataSource.createEntityManager())
  }

  existsByHash(hash: string) {
    return this.exist({ where: { hash } })
  }

  findByHash(hash: string) {
    return this.findOne({ where: { hash } })
  }

  deleteByHash(hash: string) {
    return this.delete({ hash })
  }
}
