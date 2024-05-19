import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Session } from './session.entity'
import type { CreateSessionDto } from './session.dto'
import type { Repository } from 'typeorm'

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
  ) {}

  async createSession(createSessionDto: CreateSessionDto): Promise<Session> {
    const session = this.sessionRepository.create(createSessionDto)
    return this.sessionRepository.save(session)
  }

  async getSessionById(key: string): Promise<Session | null> {
    return this.sessionRepository.findOne({ where: { key } })
  }

  async deleteSession(key: string): Promise<void> {
    await this.sessionRepository.delete({ key })
  }
}
