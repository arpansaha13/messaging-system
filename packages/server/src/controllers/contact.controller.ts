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
import { ContactService } from 'src/services/contact.service'
// Custom Decorator
import { GetPayload } from 'src/auth/getPayload.decorator'
// Interceptors
import { TransformToPlainInterceptor } from 'src/interceptors/toPlain.interceptor'
// DTOs
import { AddToContactDto } from 'src/dtos/addToContact.dto'
// Types
import type { UserEntity } from 'src/entities/user.entity'
import type { ContactModel } from 'src/models/contact.model'

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
