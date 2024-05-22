import { BadRequestException, ConflictException, Injectable, InternalServerErrorException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Brackets, Like } from 'typeorm'
import { User } from 'src/users/user.entity'
import { UserService } from 'src/users/user.service'
import { Contact } from './contact.entity'
import { ContactRepository } from './contact.repository'

@Injectable()
export class ContactService {
  constructor(
    private readonly userService: UserService,

    @InjectRepository(ContactRepository)
    private contactRepository: ContactRepository,
  ) {}

  private contactSelect: {
    id: true
    alias: true
    userInContact: {
      id: true
      dp: true
      bio: true
      username: true
      globalName: true
    }
  }

  // TODO: fix response types
  async getAllContactsOfUser(authUser: User): Promise<Record<string, any[]>> {
    const contactsRes = await this.contactRepository.find({
      select: this.contactSelect,
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
        username: contactResItem.userInContact.username,
        globalName: contactResItem.userInContact.globalName,
      })
    }

    return newContacts
  }

  async getContactsByQuery(authUser: User, search: string): Promise<any[]> {
    const res = await this.contactRepository
      .createQueryBuilder('contact')
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
      .where('contact.user.id = :userId', { userId: authUser.id })
      .andWhere(
        new Brackets(qb => {
          qb.where('contact.alias ILIKE :searchString', { searchString: `%${search}%` })
            .orWhere('userInContact.globalName ILIKE :searchString', { searchString: `%${search}%` })
            .orWhere('userInContact.username ILIKE :searchString', { searchString: `%${search}%` })
        }),
      )
      .getMany()

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
