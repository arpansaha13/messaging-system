import { Module } from '@nestjs/common'
import { InviteRepository } from './invite.repository'
import { InviteController } from './invite.controller'
import { InviteService } from './invite.service'
import { UserGroupRepository } from 'src/user_group/user-group.repository'

@Module({
  controllers: [InviteController],
  providers: [InviteRepository, InviteService, UserGroupRepository],
})
export class InviteModule {}
