import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { SessionRepository } from './session.repository'
import type { Session } from './session.entity'
import type { CreateSessionDto } from './session.dto'

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(SessionRepository)
    private readonly sessionRepository: SessionRepository,
  ) {}

  async createSession(createSessionDto: CreateSessionDto): Promise<Session> {
    const session = this.sessionRepository.create(createSessionDto)
    return this.sessionRepository.save(session)
  }

  async getSessionById(key: Session['key']): Promise<Session | null> {
    return this.sessionRepository.findOne({ where: { key } })
  }

  async deleteSession(key: Session['key']): Promise<void> {
    await this.sessionRepository.delete({ key })
  }
}
