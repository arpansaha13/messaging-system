import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
// Entity
import { ContactEntity } from 'src/entities/contact.entity'
// Types
import type { Repository } from 'typeorm'

@Injectable()
export class ContactService {
  constructor(
    @InjectRepository(ContactEntity)
    private contactRepository: Repository<ContactEntity>,
  ) {}

  getAllContactsOfUser(userTag: string): Promise<ContactEntity[]> {
    return this.contactRepository.find({
      where: { userTag1: userTag },
    })
  }
  getContactEntity(userTag1: string, userTag2: string): Promise<ContactEntity> {
    return this.contactRepository.findOne({
      where: { userTag1, userTag2 },
    })
  }
}

// return [
//   {
//     rowNum: 1,
//     userTag1: 'me',
//     userTag2: 'first',
//     alias: 'First Contact',
//   },
//   {
//     rowNum: 2,
//     userTag1: 'me',
//     userTag2: 'second',
//     alias: 'Second Contact',
//   },
//   {
//     rowNum: 3,
//     userTag1: 'me',
//     userTag2: 'third',
//     alias: 'Third Contact',
//   },
// ]
