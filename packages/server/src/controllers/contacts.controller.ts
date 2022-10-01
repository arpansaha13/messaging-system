import { Controller, Get } from '@nestjs/common'
import { ContactsService } from 'src/services/contacts.service'
// Models
import type { ContactModel } from 'src/models/contact.model'

@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Get()
  getChatList(): ContactModel[] {
    return this.contactsService.getContacts()
  }
}
