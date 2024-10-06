import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { UserRepository } from './user.repository'
import { ContactRepository } from 'src/contacts/contact.repository'
import { isNullOrUndefined } from '@arpansaha13/utils'
import type { User } from 'src/users/user.entity'
import type { UpdateUserInfoDto } from './dto/update-user-info.dto'
import type { UserSearchQuery } from './dto/user-search-query.dto'

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserRepository)
    private userRepository: UserRepository,

    @InjectRepository(ContactRepository)
    private contactRepository: ContactRepository,
  ) {}

  async getUserById(userId: User['id']): Promise<User> {
    const user = await this.userRepository.findOneBy({ id: userId })
    if (user === null) throw new NotFoundException('User could not be found.')
    return user
  }

  async updateUserInfo(userId: User['id'], data: UpdateUserInfoDto): Promise<User> {
    const updateResult = await this.userRepository.update(userId, { ...data })
    if (updateResult.affected) return this.getUserById(userId)
    else throw new NotFoundException()
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
