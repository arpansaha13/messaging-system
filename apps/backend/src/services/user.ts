import { UserRepository } from '../repositories/user'
import { ContactRepository } from '../repositories/contact'
import { ChannelRepository } from '../repositories/channel'
import { UserGroupRepository } from '../repositories/user-group'
import { User } from '../models/user'
import type { Request } from 'express'
import type { Group } from '../models/group'
import type { Channel } from '../models/channel'

interface AuthUserResponse extends Pick<Request, 'user'> {
  groups: Group['id'][]
  channels: Channel['id'][]
}

export class UserService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly contactRepo: ContactRepository,
    private readonly userGroupRepo: UserGroupRepository,
    private readonly channelRepo: ChannelRepository,
  ) {}

  async getAuthUser(authUser: Request['user']): Promise<AuthUserResponse> {
    const groupIds = await this.userGroupRepo.getGroupIdsByUserId(authUser.id)
    const channelIds = await this.channelRepo.getChannelIdsByGroupIds(groupIds)

    return {
      ...authUser,
      groups: groupIds,
      channels: channelIds,
    }
  }

  createUser(data: Partial<User>): Promise<User> {
    return this.userRepo.createUser(data)
  }

  updateUser(id: number, data: Partial<User>) {
    return this.userRepo.updateUser(id, data)
  }

  deleteUser(id: number) {
    return this.userRepo.deleteUser(id)
  }

  findUsers(authUserId: number, query: string) {
    return this.userRepo.findByQuery(authUserId, query)
  }

  async getUserWithContactById(authUserId: number, userId: number) {
    const user = await this.userRepo.findById(userId)
    if (!user) throw new Error('User could not be found.')

    const contact = await this.contactRepo.findOne({
      where: {
        user: { id: authUserId },
        userInContact: { id: userId },
      },
    })

    return {
      ...user,
      contact: contact ? { id: contact.id, alias: contact.alias } : null,
    }
  }
}
