import { Module } from '@nestjs/common'
import { GroupService } from './group.service'
import { GroupRepository } from './group.repository'
import { GroupController } from './group.controller'
import { InviteRepository } from 'src/invites/invite.repository'
import { ChannelRepository } from 'src/channels/channel.repository'
import { UserGroupRepository } from 'src/user_group/user-group.repository'

@Module({
  controllers: [GroupController],
  providers: [ChannelRepository, GroupRepository, GroupService, InviteRepository, UserGroupRepository],
})
export class GroupModule {}
