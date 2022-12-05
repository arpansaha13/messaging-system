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

  async getAllContactsOfUser(authUser: UserEntity): Promise<ContactEntity[]> {
    return this.contactRepository.find({
      select: {
        id: true,
        alias: true,
        userInContact: {
          displayName: true,
          id: true,
          dp: true,
          bio: true,
        },
      },
      where: { user: { id: authUser.id } },
      order: { alias: 'ASC' },
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
