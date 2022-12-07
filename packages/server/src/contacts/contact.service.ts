import { BadRequestException, ConflictException, Injectable, InternalServerErrorException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
// Entities
import { UserEntity } from 'src/users/user.entity'
import { ContactEntity } from './contact.entity'
// Types
import type { Repository } from 'typeorm'

@Injectable()
export class ContactService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,

    @InjectRepository(ContactEntity)
    private contactRepository: Repository<ContactEntity>,
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

  async getAllContactsOfUser(authUser: UserEntity): Promise<ContactEntity[]> {
    return this.contactRepository.find({
      select: this.#contactSelect,
      where: { user: { id: authUser.id } },
      order: { alias: 'ASC' },
      relations: { userInContact: true },
    })
  }

  // TODO: Add validation - if the contact is not of the user, then throe Unauthorized error
  async getContactById(contactId: number): Promise<ContactEntity> {
    return this.contactRepository.findOne({
      select: this.#contactSelect,
      where: { id: contactId },
      relations: { userInContact: true },
    })
  }
  async getContactByUserId(authUser: UserEntity, userId: number): Promise<ContactEntity> {
    return this.contactRepository.findOne({
      select: this.#contactSelect,
      where: { user: { id: authUser.id }, userInContact: { id: userId } },
      relations: { userInContact: true },
    })
  }

  async addToContactsOfUser(authUser: UserEntity, userIdToAdd: number, alias: string): Promise<string> {
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
    const userToAdd = await this.userRepository.findOne({
      where: { id: userIdToAdd },
    })
    if (userToAdd === null) {
      throw new BadRequestException('Invalid user id.')
    }
    const newContact = new ContactEntity()
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
