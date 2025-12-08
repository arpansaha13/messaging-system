import { ContactRepository } from '../repositories/contact.repository'
import { UserRepository } from '../repositories/user.repository'

export class ContactService {
  constructor(
    private readonly contactRepo: ContactRepository,
    private readonly userRepo: UserRepository,
  ) {}

  getContacts(authUserId: number) {
    return this.contactRepo.getContactsByUserId(authUserId)
  }

  getContactsByQuery(authUserId: number, search: string) {
    return this.contactRepo.getContactsByUserIdAndQuery(authUserId, search)
  }

  async addContact(authUserId: number, userIdToAdd: number, alias: string) {
    if (authUserId === userIdToAdd) throw new Error('Invalid user ids')

    const exists = await this.contactRepo.existsByUserIds(authUserId, userIdToAdd)
    if (exists) throw new Error('Contact already exists')

    // load userInContact basic fields
    const userToAdd = await this.userRepo.findOne({
      select: ['id', 'dp', 'bio', 'username', 'globalName'],
      where: { id: userIdToAdd },
    })

    if (!userToAdd) throw new Error('Invalid user id')

    const newContact = await this.contactRepo.createContact({ id: authUserId }, userToAdd, alias)

    return {
      id: newContact.id,
      alias: newContact.alias,
      userInContact: newContact.userInContact,
    }
  }

  editAlias(contactId: number, newAlias: string) {
    return this.contactRepo.updateContact(contactId, { alias: newAlias })
  }

  deleteContact(contactId: number) {
    return this.contactRepo.deleteContact(contactId)
  }
}
