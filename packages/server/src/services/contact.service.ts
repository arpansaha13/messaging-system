import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
// Entity
import { UserEntity } from 'src/entities/user.entity'
import { ContactEntity } from 'src/entities/contact.entity'
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

  getAllContactsOfUser(auth_user_id: number): Promise<ContactEntity[]> {
    return this.contactRepository.find({
      where: { user: auth_user_id },
      relations: {
        contact_user: true,
      },
    })
  }
  /**
   * @param auth_user_id id of authorized user
   * @param contact_user_id user_id of the user to be added to contacts.
   * @param alias alias for this contact.
   */
  async addToContactsOfUser(
    auth_user_id: number,
    contact_user_id: number,
    alias: string,
  ): Promise<string> {
    if (auth_user_id === contact_user_id) {
      throw new BadRequestException('Invalid contact_user_id')
    }
    const existing = await this.contactRepository.count({
      where: {
        user: auth_user_id,
        contact_user_id,
      },
    })
    if (existing > 0) {
      throw new ConflictException('Given contact is already added.')
    }
    const contact_user = await this.userRepository.findOne({
      where: { id: contact_user_id },
    })
    if (contact_user === null) {
      throw new BadRequestException('Invalid contact_user_id')
    }
    const contactEntity = this.contactRepository.create({
      user: auth_user_id,
      contact_user_id,
      contact_user: contact_user_id,
      alias: alias,
    })
    try {
      await this.contactRepository.save(contactEntity)
      return `${alias} has been added to contacts.`
    } catch (error) {
      throw new InternalServerErrorException()
    }
  }
  getContactEntity(
    auth_user_id: number,
    contact_user_id: number,
  ): Promise<ContactEntity> {
    return this.contactRepository.findOne({
      where: {
        user: auth_user_id,
        contact_user_id,
      },
    })
  }
}
