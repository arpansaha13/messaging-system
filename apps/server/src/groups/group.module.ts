import { Module } from '@nestjs/common'
import { GroupService } from './group.service'
import { GroupRepository } from './group.repository'
import { GroupController } from './group.controller'

@Module({
  controllers: [GroupController],
  providers: [GroupRepository, GroupService],
})
export class GroupModule {}
