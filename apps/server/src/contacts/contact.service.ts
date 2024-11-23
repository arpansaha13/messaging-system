import { BadRequestException, ConflictException, Injectable, InternalServerErrorException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { User } from 'src/users/user.entity'
import { Contact } from './contact.entity'
import { ContactRepository } from './contact.repository'

@Injectable()
export class ContactService {
  constructor(
    @InjectRepository(ContactRepository)
    private contactRepository: ContactRepository,
  ) {}

  async getContacts(authUser: User): Promise<any> {
    return this.contactRepository.getContactsByUserId(authUser.id)
  }

  async getContactsByQuery(authUser: User, search: string): Promise<any[]> {
    return this.contactRepository.getContactsByUserIdAndQuery(authUser.id, search)
  }

  async addContact(authUser: User, userIdToAdd: User['id'], alias: Contact['alias']): Promise<any> {
    if (authUser.id === userIdToAdd) {
      throw new BadRequestException('Invalid user ids.')
    }

    const newContact = await this.contactRepository.manager.transaction(async txnManager => {
      const contactExists = await txnManager.exists(Contact, {
        where: {
          user: { id: authUser.id },
          userInContact: { id: userIdToAdd },
        },
      })

      if (contactExists) {
        throw new ConflictException('Given contact is already added.')
      }

      const userToAdd = await txnManager.findOne(User, {
        select: ['id', 'dp', 'bio', 'username', 'globalName'],
        where: { id: userIdToAdd },
      })

      if (userToAdd === null) {
        throw new BadRequestException('Invalid user id.')
      }

      const newContact = new Contact()
      newContact.user = authUser
      newContact.userInContact = userToAdd
      newContact.alias = alias

      try {
        return txnManager.save(newContact)
      } catch (err) {
        console.error(err)
        throw new InternalServerErrorException()
      }
    })

    return {
      id: newContact.id,
      alias: newContact.alias,
      userInContact: newContact.userInContact,
    }
  }

  async editAlias(contactId: Contact['id'], newAlias: Contact['alias']) {
    await this.contactRepository.update({ id: contactId }, { alias: newAlias })
  }

  async deleteContact(contactId: Contact['id']) {
    await this.contactRepository.delete({ id: contactId })
  }
}
