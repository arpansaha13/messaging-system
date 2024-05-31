import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { ContactService } from 'src/contacts/contact.service'
import { AddContactDto } from './dto/add-contact.dto'
import { GetContactsQueryDto } from './dto/get-contacts-query.dto'
import { DeleteContactParamDto } from './dto/delete-contact-param.dto'
import { EditAliasBodyDto, EditAliasParamDto } from './dto/edit-alias.dto'
import type { Request } from 'express'
import type { IContact } from '@pkg/types'

@Controller('contacts')
@UseGuards(AuthGuard())
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Get()
  getContacts(
    @Req() request: Request,
    @Query() query: GetContactsQueryDto,
  ): Promise<IContact[] | Record<string, IContact[]>> {
    if (query.search) {
      return this.contactService.getContactsByQuery(request.user, query.search)
    }
    return this.contactService.getContacts(request.user)
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  addContact(@Req() request: Request, @Body() contact: AddContactDto): Promise<IContact> {
    return this.contactService.addContact(request.user, contact.userIdToAdd, contact.alias)
  }

  @Patch('/:contactId')
  @HttpCode(HttpStatus.NO_CONTENT)
  editAlias(@Param() params: EditAliasParamDto, @Body() data: EditAliasBodyDto): Promise<void> {
    return this.contactService.editAlias(params.contactId, data.new_alias)
  }

  @Delete('/:contactId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteContact(@Param() params: DeleteContactParamDto): Promise<void> {
    return this.contactService.deleteContact(params.contactId)
  }
}
