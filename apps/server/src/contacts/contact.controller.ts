import {
  BadGatewayException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
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
// DTO
import { AddToContactDto } from 'src/contacts/dto/addToContact.dto'
import { GetContactsQueryDto } from './dto/get-contacts-query.dto'
// Types
import type { UserEntity } from 'src/users/user.entity'
import type { ContactEntity } from './contact.entity'

@Controller('contacts')
@UseGuards(AuthGuard())
@UseInterceptors(TransformToPlainInterceptor)
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Get()
  getContacts(
    @GetPayload('user') authUser: UserEntity,
    @Query() query: GetContactsQueryDto,
  ): Promise<ContactEntity | ContactEntity[]> {
    if (query.contactId && query.userId) {
      throw new BadGatewayException('Invalid query params.')
    }
    if (query.contactId) {
      return this.contactService.getContactById(query.contactId)
    }
    if (query.userId) {
      return this.contactService.getContactByUserId(authUser, query.userId)
    }
    return this.contactService.getAllContactsOfUser(authUser)
  }

  @Post()
  addToContacts(@GetPayload('user') authUser: UserEntity, @Body() contact: AddToContactDto): Promise<string> {
    return this.contactService.addToContactsOfUser(authUser, contact.userIdToAdd, contact.alias)
  }
}
