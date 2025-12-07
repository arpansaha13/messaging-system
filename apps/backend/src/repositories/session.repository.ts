import { Repository } from 'typeorm'
import AppDataSource from '../data-source'
import { Session } from '../models/session.entity'

export class SessionRepository extends Repository<Session> {
  constructor() {
    super(Session, AppDataSource.createEntityManager())
  }

  findByKey(key: string) {
    return this.findOne({ where: { key } })
  }

  deleteByKey(key: string) {
    return this.delete({ key } as any)
  }
}
