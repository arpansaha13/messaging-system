import { BadRequestException, ConflictException, Injectable, InternalServerErrorException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { User } from 'src/users/user.entity'
import { ContactRepository } from './contact.repository'
import type { IContact } from '@shared/types'
import { Contact } from './contact.entity'

@Injectable()
export class ContactService {
  constructor(
    @InjectRepository(ContactRepository)
    private contactRepository: ContactRepository,
  ) {}

  // TODO: fix response types
  async getContacts(authUser: User): Promise<Record<string, IContact[]>> {
    const contactsRes = await this.contactRepository.getContactsByUserId(authUser.id)

    const newContacts = {}

    for (const contactResItem of contactsRes) {
      const letter = contactResItem.alias[0]
      if (typeof newContacts[letter] === 'undefined') newContacts[letter] = []

      newContacts[letter].push({
        alias: contactResItem.alias,
        contactId: contactResItem.id,
        userId: contactResItem.userInContact.id,
        bio: contactResItem.userInContact.bio,
        dp: contactResItem.userInContact.dp,
        username: contactResItem.userInContact.username,
        globalName: contactResItem.userInContact.globalName,
      })
    }

    return newContacts
  }

  async getContactsByQuery(authUser: User, search: string): Promise<IContact[]> {
    const res = await this.contactRepository.getContactsByUserIdAndQuery(authUser.id, search)

    return res.map(resItem => ({
      alias: resItem.alias,
      contactId: resItem.id,
      userId: resItem.userInContact.id,
      bio: resItem.userInContact.bio,
      dp: resItem.userInContact.dp,
      username: resItem.userInContact.username,
      globalName: resItem.userInContact.globalName,
    }))
  }

  async addContact(authUser: User, userIdToAdd: number, alias: string): Promise<IContact> {
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

      const userToAdd = await txnManager.findOneBy(User, { id: userIdToAdd })
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
      contactId: newContact.id,
      alias: alias,
      userId: userIdToAdd,
      dp: newContact.userInContact.dp,
      bio: newContact.userInContact.bio,
      username: newContact.userInContact.username,
      globalName: newContact.userInContact.globalName,
    }
  }

  async editAlias(contactId: number, newAlias: string) {
    await this.contactRepository.update({ id: contactId }, { alias: newAlias })
  }

  async deleteContact(contactId: number) {
    await this.contactRepository.delete({ id: contactId })
  }
}
