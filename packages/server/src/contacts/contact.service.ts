import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
// Model
import { ContactModel } from 'src/contacts/contact.model'
// Entities
import { UserEntity } from 'src/users/user.entity'
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

  async getAllContactsOfUser(auth_user_id: number): Promise<ContactModel> {
    /** Format the response as required by the client - Group all contacts by the first letter of alias */
    function groupAlphabetically(
      contactEntities: Pick<ContactEntity, 'alias' | 'contact_user'>[],
    ) {
      const res: ContactModel = {}

      for (const contactEntity of contactEntities) {
        const letter = contactEntity.alias[0].toUpperCase()
        if (typeof res[letter] === 'undefined') {
          res[letter] = []
        }
        res[letter].push(contactEntity)
      }
      return res
    }

    return groupAlphabetically(
      await this.contactRepository.find({
        select: ['alias', 'contact_user'],
        where: {
          user_id: auth_user_id,
        },
        relations: {
          contact_user: true,
        },
      }),
    )
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
        user_id: auth_user_id,
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
      user_id: auth_user_id,
      contact_user_id,
      contact_user,
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
        user_id: auth_user_id,
        contact_user_id,
      },
    })
  }
}
