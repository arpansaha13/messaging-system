import { Body, Controller, Get, Post, UseGuards, UseInterceptors } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
// Service
import { ContactService } from 'src/contacts/contact.service'
// Custom Decorator
import { GetPayload } from 'src/common/decorators/getPayload.decorator'
// Interceptors
import { TransformToPlainInterceptor } from 'src/common/interceptors/toPlain.interceptor'
// DTOs
import { AddToContactDto } from 'src/contacts/dto/addToContact.dto'
// Types
import type { UserEntity } from 'src/users/user.entity'
import type { ContactEntity } from './contact.entity'

@Controller('contacts')
@UseGuards(AuthGuard())
@UseInterceptors(TransformToPlainInterceptor)
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Get()
  getContacts(@GetPayload('user') authUser: UserEntity): Promise<ContactEntity[]> {
    return this.contactService.getAllContactsOfUser(authUser)
  }

  @Post()
  addToContacts(@GetPayload('user') authUser: UserEntity, @Body() contact: AddToContactDto): Promise<string> {
    return this.contactService.addToContactsOfUser(authUser, contact.userIdToAdd, contact.alias)
  }
}
