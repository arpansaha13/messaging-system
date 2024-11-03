import { Module } from '@nestjs/common'
import { UserGroupRepository } from 'src/user_group/user-group.repository'

@Module({
  providers: [UserGroupRepository],
  exports: [UserGroupRepository],
})
export class UserGroupModule {}
