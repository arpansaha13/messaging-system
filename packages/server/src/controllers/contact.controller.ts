import { Controller, Get, Param } from '@nestjs/common'
import { ContactService } from 'src/services/contact.service'
// Entity
import { ContactEntity } from 'src/entities/contact.entity'

@Controller('contacts')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Get('/:userTag')
  getContacts(@Param('userTag') userTag: string): Promise<ContactEntity[]> {
    return this.contactService.getAllContactsOfUser(userTag)
  }
}
