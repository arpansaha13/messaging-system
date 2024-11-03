import { Module } from '@nestjs/common'
import { InviteRepository } from './invite.repository'
import { InviteController } from './invite.controller'
import { InviteService } from './invite.service'
import { UserGroupModule } from 'src/user_group/user_group.module'

@Module({
  imports: [UserGroupModule],
  controllers: [InviteController],
  providers: [InviteRepository, InviteService],
  exports: [InviteRepository],
})
export class InviteModule {}
