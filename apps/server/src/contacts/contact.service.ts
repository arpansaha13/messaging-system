import { BadRequestException, ConflictException, Injectable, InternalServerErrorException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { User } from 'src/users/user.entity'
import { UserRepository } from 'src/users/user.repository'
import { ContactRepository } from './contact.repository'

@Injectable()
export class ContactService {
  constructor(
    @InjectRepository(UserRepository)
    private userRepository: UserRepository,

    @InjectRepository(ContactRepository)
    private contactRepository: ContactRepository,
  ) {}

  // TODO: fix response types
  async getContacts(authUser: User): Promise<Record<string, any[]>> {
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

  async getContactsByQuery(authUser: User, search: string): Promise<any[]> {
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

  async addToContacts(authUser: User, userIdToAdd: number, alias: string): Promise<string> {
    if (authUser.id === userIdToAdd) {
      throw new BadRequestException('Invalid user ids.')
    }

    if (await this.contactRepository.existsByUserIds(authUser.id, userIdToAdd)) {
      throw new ConflictException('Given contact is already added.')
    }

    const userToAdd = await this.userRepository.findOneBy({ id: userIdToAdd })
    if (userToAdd === null) {
      throw new BadRequestException('Invalid user id.')
    }

    try {
      await this.contactRepository.createContact(authUser, userToAdd, alias)
      return `${alias} has been added to contacts.`
    } catch (error) {
      throw new InternalServerErrorException()
    }
  }
}
