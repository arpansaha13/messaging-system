import { Module } from '@nestjs/common'
import { SessionService } from './session.service'
import { SessionRepository } from './session.repository'

@Module({
  providers: [SessionRepository, SessionService],
  exports: [SessionService],
})
export class SessionModule {}
