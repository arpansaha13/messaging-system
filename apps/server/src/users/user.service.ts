import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { isNullOrUndefined } from '@arpansaha13/utils'
import { UserRepository } from './user.repository'
import { ContactRepository } from 'src/contacts/contact.repository'
import { ChannelRepository } from 'src/channels/channel.repository'
import { UserGroupRepository } from 'src/user_group/user-group.repository'
import type { User } from 'src/users/user.entity'
import type { UpdateUserInfoDto } from './dto/update-user-info.dto'
import type { UserSearchQuery } from './dto/user-search-query.dto'
import type { GetUserWithContactResponse } from './dto/get-user-with-contact.response'
import type { AuthUserResponse } from './dto/auth-user-details.response'

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserRepository)
    private readonly userRepository: UserRepository,

    @InjectRepository(ContactRepository)
    private readonly contactRepository: ContactRepository,

    @InjectRepository(UserGroupRepository)
    private readonly userGroupRepository: UserGroupRepository,

    @InjectRepository(ChannelRepository)
    private readonly channelRepository: ChannelRepository,
  ) {}

  async getAuthUser(authUser: User): Promise<AuthUserResponse> {
    const groupIds = await this.userGroupRepository.getGroupIdsByUserId(authUser.id)
    const channelIds = await this.channelRepository.getChannelIdsByUserId(groupIds)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...rest } = authUser

    return {
      ...rest,
      channels: channelIds,
    }
  }

  async getUserWithContactById(authUserId: User['id'], userId: User['id']): Promise<GetUserWithContactResponse> {
    const user = await this.userRepository.findOne({
      select: ['id', 'globalName', 'username', 'bio', 'dp'],
      where: { id: userId },
    })

    if (user === null) throw new NotFoundException('User could not be found.')

    const contact = await this.contactRepository.findOne({
      select: ['id', 'alias'],
      where: { user: { id: authUserId }, userInContact: { id: userId } },
    })

    return { ...user, contact }
  }

  async updateUserInfo(userId: User['id'], data: UpdateUserInfoDto): Promise<User> {
    const updateResult = await this.userRepository.update(userId, { ...data })
    if (updateResult.affected) {
      return this.userRepository.findOne({
        select: ['id', 'globalName', 'username', 'bio', 'dp'],
        where: { id: userId },
      })
    }
    throw new NotFoundException()
  }

  async findUsers(authUserId: User['id'], query: UserSearchQuery): Promise<User[]> {
    if (!query.text) return []

    const users = await this.userRepository.getUsersByQuery(authUserId, query.text)

    if (users.length === 0) return []

    const contacts = await this.contactRepository
      .createQueryBuilder('contact')
      .select('contact.id', 'id')
      .addSelect('contact.alias', 'alias')
      .addSelect('userInContact.id', 'userIdInContact')
      .innerJoin('contact.userInContact', 'userInContact')
      .where('contact.user.id = :userId', { userId: authUserId })
      .andWhere('contact.userInContact.id IN (:...searchedUserIds)', { searchedUserIds: users.map(u => u.id) })
      .getRawMany()

    const contactsMap = new Map()
    contacts.forEach(contact => {
      const { id, alias, userIdInContact } = contact
      contactsMap.set(userIdInContact, { id, alias })
    })

    return users.map(u => {
      const contact = contactsMap.get(u.id)

      if (isNullOrUndefined(contact)) return u
      else return { ...u, contact }
    })
  }
}
