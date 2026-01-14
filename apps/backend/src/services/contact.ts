import { ContactRepository } from '../repositories/contact'
import { AuthService } from './auth'

export class ContactService {
  constructor(private readonly contactRepo: ContactRepository) {}

  getContacts(context: any) {
    const authUserId = context.user.id
    return this.contactRepo.getContactsByUserId(authUserId)
  }

  getContactsByQuery(context: any, search: string) {
    const authUserId = context.user.id
    return this.contactRepo.getContactsByUserIdAndQuery(authUserId, search)
  }

  async addContact(context: any, userIdToAdd: number, alias: string) {
    const authUserId = context.user.id
    if (authUserId === userIdToAdd) throw new Error('Invalid user ids')

    const exists = await this.contactRepo.existsByUserIds(authUserId, userIdToAdd)
    if (exists) throw new Error('Contact already exists')

    // Get user from auth-system via gRPC
    const userToAdd = await AuthService.getUser(userIdToAdd, context.token)
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
