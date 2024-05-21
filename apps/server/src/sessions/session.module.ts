import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Session } from './session.entity'
import { SessionService } from './session.service'
import { SessionRepository } from './session.repository'

@Module({
  imports: [TypeOrmModule.forFeature([Session])],
  providers: [SessionRepository, SessionService],
  exports: [SessionService],
})
export class SessionModule {}
