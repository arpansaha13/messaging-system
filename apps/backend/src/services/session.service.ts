import { SessionRepository } from '../repositories/session.repository'

export class SessionService {
  constructor(private repo: SessionRepository) {}

  createSession(data: Partial<any>) {
    const entity = this.repo.create(data)
    return this.repo.save(entity)
  }

  getSessionById(key: string) {
    return this.repo.findByKey(key)
  }

  deleteSession(key: string) {
    return this.repo.deleteByKey(key)
  }
}
