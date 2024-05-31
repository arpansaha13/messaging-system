import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { ContactService } from 'src/contacts/contact.service'
import { AddToContactDto } from './dto/add-to-contact.dto'
import { GetContactsQueryDto } from './dto/get-contacts-query.dto'
import { EditAliasBodyDto, EditAliasParamDto } from './dto/edit-alias.dto'
import type { Request } from 'express'
import type { Contact } from './contact.entity'

@Controller('contacts')
@UseGuards(AuthGuard())
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
    return this.contactService.getContacts(request.user)
  }

  @Post()
  addToContacts(@Req() request: Request, @Body() contact: AddToContactDto): Promise<string> {
    return this.contactService.addToContacts(request.user, contact.userIdToAdd, contact.alias)
  }

  @Patch('/:contactId')
  editAlias(
    @Req() request: Request,
    @Param() params: EditAliasParamDto,
    @Body() data: EditAliasBodyDto,
  ): Promise<void> {
    return this.contactService.editAlias(request.user, params.contactId, data.new_alias)
  }
}
