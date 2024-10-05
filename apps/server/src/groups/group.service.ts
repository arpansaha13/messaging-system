import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Group } from './group.entity'
import { GroupRepository } from './group.repository'
import { CreateGroupDto } from './dto/create-group.dto'
import type { User } from 'src/users/user.entity'

@Injectable()
export class GroupService {
  constructor(
    @InjectRepository(GroupRepository)
    private groupRepository: GroupRepository,
  ) {}

  async createGroup(authUser: User, createGroupDto: CreateGroupDto): Promise<Group> {
    const newGroup = new Group()
    newGroup.name = createGroupDto.name
    newGroup.founder = authUser

    return this.groupRepository.save(newGroup)
  }
}
