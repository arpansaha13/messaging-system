import { Module } from '@nestjs/common'
import { GroupService } from './group.service'
import { GroupRepository } from './group.repository'
import { GroupController } from './group.controller'
import { ChannelRepository } from 'src/channels/channel.repository'
import { UserGroupRepository } from 'src/user_group/user-group.repository'

@Module({
  controllers: [GroupController],
  providers: [ChannelRepository, GroupRepository, GroupService, UserGroupRepository],
})
export class GroupModule {}
