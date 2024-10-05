import { Injectable } from '@nestjs/common'
import { InjectEntityManager, InjectRepository } from '@nestjs/typeorm'
import { Group } from './group.entity'
import { GroupRepository } from './group.repository'
import { CreateGroupDto } from './dto/create-group.dto'
import { UserGroup } from 'src/user_group/user-group.entity'
import { UserGroupRepository } from 'src/user_group/user-group.repository'
import type { User } from 'src/users/user.entity'
import type { EntityManager } from 'typeorm'

@Injectable()
export class GroupService {
  constructor(
    @InjectEntityManager()
    private manager: EntityManager,

    @InjectRepository(GroupRepository)
    private groupRepository: GroupRepository,

    @InjectRepository(UserGroupRepository)
    private userGroupRepository: UserGroupRepository,
  ) {}

  async getGroupsOfUser(authUser: User): Promise<Group[]> {
    const userGroups = await this.userGroupRepository.find({
      where: { user: { id: authUser.id } },
      relations: {
        group: {
          founder: true,
        },
      },
    })

    return userGroups.map(ug => ug.group)
  }

  async createGroup(authUser: User, createGroupDto: CreateGroupDto): Promise<Group> {
    const newGroup = await this.manager.transaction(async txnManager => {
      let newGroup = new Group()
      newGroup.name = createGroupDto.name
      newGroup.founder = authUser
      newGroup = await txnManager.save(Group, newGroup)

      const newUserGroup = new UserGroup()
      newUserGroup.group = newGroup
      newUserGroup.user = authUser
      await txnManager.save(UserGroup, newUserGroup)

      return newGroup
    })

    return newGroup
  }
}
