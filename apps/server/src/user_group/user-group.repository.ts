import { Injectable } from '@nestjs/common'
import { Repository, DataSource } from 'typeorm'
import { UserGroup } from './user-group.entity'
import type { User } from 'src/users/user.entity'
import type { Group } from 'src/groups/group.entity'

@Injectable()
export class UserGroupRepository extends Repository<UserGroup> {
  constructor(private dataSource: DataSource) {
    super(UserGroup, dataSource.createEntityManager())
  }

  async getMembersByGroupId(groupId: Group['id']): Promise<User[]> {
    const userGroups = await this.find({
      select: ['id', 'user'],
      where: { group: { id: groupId } },
      relations: { user: true },
    })
    return userGroups.map(userGroup => userGroup.user)
  }
}
