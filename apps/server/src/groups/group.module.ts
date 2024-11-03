import { Module } from '@nestjs/common'
import { GroupService } from './group.service'
import { GroupRepository } from './group.repository'
import { GroupController } from './group.controller'
import { InviteModule } from 'src/invites/invite.module'
import { ChannelModule } from 'src/channels/channel.module'
import { UserGroupModule } from 'src/user_group/user_group.module'

@Module({
  imports: [ChannelModule, InviteModule, UserGroupModule],
  controllers: [GroupController],
  providers: [GroupRepository, GroupService],
})
export class GroupModule {}
