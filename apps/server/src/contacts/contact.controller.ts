import {
  BadGatewayException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { ContactService } from 'src/contacts/contact.service'
import { TransformToPlainInterceptor } from 'src/common/interceptors/toPlain.interceptor'
import { AddToContactDto } from 'src/contacts/dto/add-to-contact.dto'
import { GetContactsQueryDto } from './dto/get-contacts-query.dto'
import type { Request } from 'express'
import type { Contact } from './contact.entity'

@Controller('contacts')
@UseGuards(AuthGuard())
@UseInterceptors(TransformToPlainInterceptor)
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Get()
  getContacts(
    @Req() request: Request,
    @Query() query: GetContactsQueryDto,
  ): Promise<Contact[] | Record<string, Contact[]>> {
    if (query.search) {
      return this.contactService.getContactsByQuery(request.user, query.search)
    }
    return this.contactService.getAllContactsOfUser(request.user)
  }

  @Post()
  addToContacts(@Req() request: Request, @Body() contact: AddToContactDto): Promise<string> {
    return this.contactService.addToContactsOfUser(request.user, contact.userIdToAdd, contact.alias)
  }
}
