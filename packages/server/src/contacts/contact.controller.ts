import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
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
import type { ContactModel } from 'src/contacts/contact.model'

@Controller('contacts')
@UseGuards(AuthGuard())
@UseInterceptors(TransformToPlainInterceptor)
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Get()
  getContacts(
    @GetPayload('user') auth_user: UserEntity,
  ): Promise<ContactModel> {
    return this.contactService.getAllContactsOfUser(auth_user.id)
  }

  @Post()
  addToContacts(
    @GetPayload('user') auth_user: UserEntity,
    @Body() contact: AddToContactDto,
  ): Promise<string> {
    return this.contactService.addToContactsOfUser(
      auth_user.id,
      contact.contact_user_id,
      contact.alias,
    )
  }
}
