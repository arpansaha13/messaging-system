import { Contact } from '../models/contact.entity'
import { ContactRepository } from '../repositories/contact.repository'

export class ContactService {
  constructor(private repo: ContactRepository) {}

  getContacts(authUserId: number) {
    return this.repo.getContactsByUserId(authUserId)
  }

  getContactsByQuery(authUserId: number, search: string) {
    return this.repo.getContactsByUserIdAndQuery(authUserId, search)
  }

  async addContact(authUserId: number, userIdToAdd: number, alias: string) {
    if (authUserId === userIdToAdd) throw new Error('Invalid user ids')

    const exists = await this.repo.existsByUserIds(authUserId, userIdToAdd)
    if (exists) throw new Error('Contact already exists')

    // load userInContact basic fields
    const userToAdd = await (this.repo as any).repo.manager.findOne(Contact, {
      select: ['id', 'dp', 'bio', 'username', 'globalName'],
      where: { id: userIdToAdd },
    })

    if (!userToAdd) throw new Error('Invalid user id')

    const newContact = await this.repo.createContact({ id: authUserId } as any, userToAdd as any, alias)

    return {
      id: newContact.id,
      alias: newContact.alias,
      userInContact: newContact.userInContact,
    }
  }

  editAlias(contactId: number, newAlias: string) {
    return this.repo.updateContact(contactId, { alias: newAlias })
  }

  deleteContact(contactId: number) {
    return this.repo.deleteContact(contactId)
  }
}
