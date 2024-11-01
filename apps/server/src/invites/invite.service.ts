import { ConflictException, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { MoreThan } from 'typeorm'
import { InvalidOrExpiredException } from 'src/common/exceptions'
import { InviteRepository } from './invite.repository'
import { UserGroup } from 'src/user_group/user-group.entity'
import { UserGroupRepository } from 'src/user_group/user-group.repository'
import type { Invite } from './invite.entity'
import type { User } from 'src/users/user.entity'
import type { Group } from 'src/groups/group.entity'

@Injectable()
export class InviteService {
  constructor(
    @InjectRepository(InviteRepository)
    private inviteRepository: InviteRepository,

    @InjectRepository(UserGroupRepository)
    private userGroupRepository: UserGroupRepository,
  ) {}

  async getInvite(authUser: User, inviteHash: Invite['hash']): Promise<Invite> {
    const invite = await this.inviteRepository.findOne({
      where: { hash: inviteHash, expiresAt: MoreThan(new Date()) },
      relations: { group: true },
    })

    if (!invite) {
      throw new InvalidOrExpiredException('This invite link is either invalid or expired.')
    }

    const userExistsInGroup = await this.userGroupRepository.exists({
      where: { user: { id: authUser.id }, group: { id: invite.group.id } },
    })

    if (userExistsInGroup) {
      throw new ConflictException({
        data: {
          hash: invite.hash,
          group: { id: invite.group.id },
        },
        message: 'User has already joined group',
      })
    }

    return invite
  }

  async acceptInvite(authUser: User, inviteHash: Invite['hash']): Promise<Group> {
    const invite = await this.getInvite(authUser, inviteHash)

    const userGroup = new UserGroup()
    userGroup.user = authUser
    userGroup.group = invite.group
    await this.userGroupRepository.save(userGroup)
    return invite.group
  }
}
