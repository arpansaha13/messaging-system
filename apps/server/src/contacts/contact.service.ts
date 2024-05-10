import { BadRequestException, ConflictException, Injectable, InternalServerErrorException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { UserService } from 'src/users/user.service'
import { Contact } from './contact.entity'
import type { Repository } from 'typeorm'
import type { User } from 'src/users/user.entity'

@Injectable()
export class ContactService {
  constructor(
    private readonly userService: UserService,

    @InjectRepository(Contact)
    private contactRepository: Repository<Contact>,
  ) {}

  #contactSelect: {
    id: true
    alias: true
    userInContact: {
      id: true
      dp: true
      bio: true
      displayName: true
    }
  }

  // TODO: fix response types
  async getAllContactsOfUser(authUser: User): Promise<Record<string, any[]>> {
    const contactsRes = await this.contactRepository.find({
      select: this.#contactSelect,
      where: { user: { id: authUser.id } },
      order: { alias: 'ASC' },
      relations: { userInContact: true },
    })

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
        displayName: contactResItem.userInContact.displayName,
      })
    }

    return newContacts
  }

  // TODO: Add validation - if the contact is not of the user, then throe Unauthorized error
  async getContactById(contactId: number): Promise<Contact> {
    return this.contactRepository.findOne({
      select: this.#contactSelect,
      where: { id: contactId },
      relations: { userInContact: true },
    })
  }

  async getContactByUserId(authUser: User, userId: number): Promise<any> {
    const res = await this.contactRepository.findOne({
      select: this.#contactSelect,
      where: { user: { id: authUser.id }, userInContact: { id: userId } },
      relations: { userInContact: true },
    })

    if (!res) return res

    return {
      alias: res.alias,
      contactId: res.id,
      userId: res.userInContact.id,
      bio: res.userInContact.bio,
      dp: res.userInContact.dp,
      displayName: res.userInContact.displayName,
    }
  }

  async addToContactsOfUser(authUser: User, userIdToAdd: number, alias: string): Promise<string> {
    if (authUser.id === userIdToAdd) {
      throw new BadRequestException('Invalid user ids.')
    }
    const existing = await this.contactRepository.count({
      where: {
        user: { id: authUser.id },
        userInContact: { id: userIdToAdd },
      },
    })
    if (existing > 0) {
      throw new ConflictException('Given contact is already added.')
    }
    const userToAdd = await this.userService.getUserById(userIdToAdd)
    if (userToAdd === null) {
      throw new BadRequestException('Invalid user id.')
    }
    const newContact = new Contact()
    newContact.user = authUser
    newContact.userInContact = userToAdd
    newContact.alias = alias

    try {
      await this.contactRepository.save(newContact)
      return `${alias} has been added to contacts.`
    } catch (error) {
      throw new InternalServerErrorException()
    }
  }
}
