import { Injectable } from '@nestjs/common'
import { Brackets, DataSource, Repository } from 'typeorm'
import { Contact } from './contact.entity'
import type { User } from 'src/users/user.entity'

@Injectable()
export class ContactRepository extends Repository<Contact> {
  constructor(private readonly dataSource: DataSource) {
    super(Contact, dataSource.createEntityManager())
  }

  getContactsByUserId(userId: User['id']) {
    return this.find({
      select: {
        id: true,
        alias: true,
        userInContact: {
          id: true,
          dp: true,
          bio: true,
          username: true,
          globalName: true,
        },
      },
      where: { user: { id: userId } },
      order: { alias: 'ASC' },
      relations: { userInContact: true },
    })
  }

  getContactsByUserIdAndQuery(userId: User['id'], search: string) {
    return this.createQueryBuilder('contact')
      .innerJoin('contact.userInContact', 'userInContact')
      .select([
        'contact.id',
        'contact.alias',
        'userInContact.id',
        'userInContact.globalName',
        'userInContact.username',
        'userInContact.bio',
        'userInContact.dp',
      ])
      .where('contact.user.id = :userId', { userId })
      .andWhere(
        new Brackets(qb => {
          // Search the beginning of each word
          // TODO: Find an efficient way to search
          const params = {
            firstWord: `${search}%`,
            remainingWords: `% ${search}%`,
          }

          qb.where('contact.alias ILIKE :firstWord OR contact.alias ILIKE :remainingWords', params)
            .orWhere(
              'userInContact.globalName ILIKE :firstWord OR userInContact.globalName ILIKE :remainingWords',
              params,
            )
            .orWhere('userInContact.username ILIKE :firstWord OR userInContact.username ILIKE :remainingWords', params)
        }),
      )
      .getMany()
  }

  createContact(user: User, userInContact: User, alias: Contact['alias']) {
    const newContact = new Contact()
    newContact.user = user
    newContact.userInContact = userInContact
    newContact.alias = alias
    return this.save(newContact)
  }

  existsByUserIds(userId: User['id'], userIdInContact: User['id']) {
    return this.exists({
      where: {
        user: { id: userId },
        userInContact: { id: userIdInContact },
      },
    })
  }

  getContactsHavingUserIds(userId: User['id'], userInContactIds: User['id'][]): Promise<any[]>
  getContactsHavingUserIds(userId: User['id'], userInContactIds: User['id']): Promise<any>

  getContactsHavingUserIds(userId: User['id'], userInContactIds: User['id'] | User['id'][]) {
    if (Array.isArray(userInContactIds) && userInContactIds.length === 0) {
      return []
    }

    const partialQuery = this.createQueryBuilder('contact')
      .select('contact.id', 'id')
      .addSelect('contact.alias', 'alias')
      .addSelect('userInContact.id', 'userIdInContact')
      .innerJoin('contact.userInContact', 'userInContact')
      .where('contact.user.id = :userId', { userId })

    if (Array.isArray(userInContactIds)) {
      return partialQuery
        .andWhere('contact.userInContact.id IN (:...userInContactIds)', { userInContactIds })
        .getRawMany()
    }

    return partialQuery
      .andWhere('contact.userInContact.id = :userInContactId', { userInContactId: userInContactIds })
      .getRawOne()
  }
}
