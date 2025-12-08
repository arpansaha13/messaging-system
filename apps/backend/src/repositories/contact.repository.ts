import { type DataSource, Repository, Brackets } from 'typeorm'
import { Contact } from '../models/contact.entity'

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
          // @ts-ignore
          dp: true,
          // @ts-ignore
          bio: true,
          // @ts-ignore
          username: true,
          // @ts-ignore
          globalName: true,
        },
      },
      where: { user: { id: userId } },
      order: { alias: 'ASC' },
      relations: { userInContact: true },
    })
  }

  getContactsByUserIdAndQuery(userId: number, search: string) {
    // Replace ILIKE (Postgres) with case-insensitive LIKE using lower()
    const qb = this.createQueryBuilder('contact').innerJoin('contact.userInContact', 'userInContact')

    const firstWord = `${search}%`
    const remainingWords = `% ${search}%`

    qb.select([
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
        new Brackets(qb2 => {
          qb2
            .where('LOWER(contact.alias) LIKE LOWER(:firstWord)')
            .orWhere('LOWER(contact.alias) LIKE LOWER(:remainingWords)')
            .orWhere('LOWER(userInContact.globalName) LIKE LOWER(:firstWord)')
            .orWhere('LOWER(userInContact.globalName) LIKE LOWER(:remainingWords)')
            .orWhere('LOWER(userInContact.username) LIKE LOWER(:firstWord)')
            .orWhere('LOWER(userInContact.username) LIKE LOWER(:remainingWords)')
        }),
      )
      .setParameters({ firstWord, remainingWords })

    return qb.getMany()
  }

  async createContact(user: any, userInContact: any, alias: string) {
    const newContact = new Contact()
    newContact.user = user
    newContact.userInContact = userInContact
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
      .addSelect('userInContact.id', 'userIdInContact')
      .innerJoin('contact.userInContact', 'userInContact')
      .where('contact.user.id = :userId', { userId })

    if (Array.isArray(userInContactIds)) {
      return partialQ.andWhere('contact.userInContact.id IN (:...userInContactIds)', { userInContactIds }).getRawMany()
    }

    return partialQ
      .andWhere('contact.userInContact.id = :userInContactId', { userInContactId: userInContactIds })
      .getRawOne()
  }

  updateContact(contactId: number, data: Partial<Contact>) {
    return this.update({ id: contactId }, data)
  }

  deleteContact(contactId: number) {
    return this.delete({ id: contactId })
  }
}
