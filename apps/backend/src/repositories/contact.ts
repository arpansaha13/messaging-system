import { type DataSource, Repository } from 'typeorm'
import { Contact } from '../models/contact'

export class ContactRepository extends Repository<Contact> {
  constructor(dataSource: DataSource) {
    super(Contact, dataSource.createEntityManager())
  }

  getContactsByUserId(userId: number) {
    return this.find({
      select: {
        id: true,
        alias: true,
        userInContact: {
          id: true,
          dp: true,
          bio: true,
          globalName: true,
        },
      },
      where: { user: { id: userId } },
      order: { alias: 'ASC' },
      relations: { userInContact: true },
    })
  }

  getContactsByUserIdAndQuery(userId: number, search: string) {
    const qb = this.createQueryBuilder('contact')

    const firstWord = `${search}%`
    const remainingWords = `% ${search}%`

    qb.select(['contact.id', 'contact.alias', 'contact.userInContact'])
      .where('contact.user_id = :userId', { userId })
      .andWhere('LOWER(contact.alias) LIKE LOWER(:firstWord) OR LOWER(contact.alias) LIKE LOWER(:remainingWords)', {
        firstWord,
        remainingWords,
      })

    return qb.getMany()
  }

  async createContact(user: any, userInContact: any, alias: string) {
    const newContact = new Contact()
    newContact.user = user
    // Handle both UserProfile entities and plain user_id values
    if (typeof userInContact === 'number') {
      newContact.userInContact = { id: userInContact } as any
    } else if (userInContact.user_id) {
      newContact.userInContact = { id: userInContact.user_id } as any
    } else {
      newContact.userInContact = userInContact
    }
    newContact.alias = alias
    return this.save(newContact)
  }

  existsByUserIds(userId: number, userIdInContact: number) {
    return this.exist({
      where: {
        user: { id: userId },
        userInContact: { id: userIdInContact },
      },
    })
  }

  async getContactsHavingUserIds(userId: number, userInContactIds: number | number[]) {
    if (Array.isArray(userInContactIds) && userInContactIds.length === 0) return []

    const partialQ = this.createQueryBuilder('contact')
      .select('contact.id', 'id')
      .addSelect('contact.alias', 'alias')
      .addSelect('contact.userInContact', 'userIdInContact')
      .where('contact.user_id = :userId', { userId })

    if (Array.isArray(userInContactIds)) {
      return partialQ.andWhere('contact.userInContact IN (:...userInContactIds)', { userInContactIds }).getRawMany()
    }

    return partialQ
      .andWhere('contact.userInContact = :userInContactId', { userInContactId: userInContactIds })
      .getRawOne()
  }

  updateContact(contactId: number, data: Partial<Contact>) {
    return this.update({ id: contactId }, data)
  }

  deleteContact(contactId: number) {
    return this.delete({ id: contactId })
  }
}
