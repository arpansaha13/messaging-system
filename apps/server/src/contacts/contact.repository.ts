import { Injectable } from '@nestjs/common'
import { Brackets, DataSource, Repository } from 'typeorm'
import { Contact } from './contact.entity'
import type { User } from 'src/users/user.entity'

@Injectable()
export class ContactRepository extends Repository<Contact> {
  constructor(private dataSource: DataSource) {
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
      .innerJoinAndSelect('contact.userInContact', 'userInContact')
      .select([
        'contact.id',
        'contact.alias',
        'userInContact.id',
        'userInContact.globalName',
        'userInContact.username',
        'userInContact.bio',
        'userInContact.dp',
      ])
      .where('contact.user.id = :userId', { userId: userId })
      .andWhere(
        new Brackets(qb => {
          qb.where('contact.alias ILIKE :searchString', { searchString: `%${search}%` })
            .orWhere('userInContact.globalName ILIKE :searchString', { searchString: `%${search}%` })
            .orWhere('userInContact.username ILIKE :searchString', { searchString: `%${search}%` })
        }),
      )
      .getMany()
  }

  createContact(user: Contact['user'], userInContact: Contact['userInContact'], alias: Contact['alias']) {
    const newContact = new Contact()
    newContact.user = user
    newContact.userInContact = userInContact
    newContact.alias = alias
    return this.save(newContact)
  }

  existsByUserIds(userId: Contact['user']['id'], userIdInContact: Contact['userInContact']['id']) {
    return this.exists({
      where: {
        user: { id: userId },
        userInContact: { id: userIdInContact },
      },
    })
  }
}
