import { Controller, Get, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
// Service
import { ContactService } from 'src/services/contact.service'
// Custom Decorator
import { GetPayload } from 'src/auth/getPayload.decorator'
// Types
import type { UserEntity } from 'src/entities/user.entity'
import type { ContactEntity } from 'src/entities/contact.entity'

@Controller('contacts')
@UseGuards(AuthGuard())
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Get()
  getContacts(
    @GetPayload('user') userEntity: UserEntity,
  ): Promise<ContactEntity[]> {
    return this.contactService.getAllContactsOfUser(userEntity.userTag)
  }
}
