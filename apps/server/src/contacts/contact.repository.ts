import { Injectable } from '@nestjs/common'
import { DataSource, Repository } from 'typeorm'
import { Contact } from './contact.entity'

@Injectable()
export class ContactRepository extends Repository<Contact> {
  constructor(private dataSource: DataSource) {
    super(Contact, dataSource.createEntityManager())
  }
}
