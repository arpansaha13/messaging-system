import { type DataSource, Repository } from 'typeorm'
import { Session } from '../models/session.entity'

export class SessionRepository extends Repository<Session> {
  constructor(dataSource: DataSource) {
    super(Session, dataSource.createEntityManager())
  }

  findByKey(key: string) {
    return this.findOne({ where: { key } })
  }

  deleteByKey(key: string) {
    return this.delete({ key } as any)
  }
}
