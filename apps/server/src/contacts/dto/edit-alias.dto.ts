import { Type } from 'class-transformer'
import { IsNotEmpty, IsNumber, IsString } from 'class-validator'
import type { Contact } from '../contact.entity'

export class EditAliasParamDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  contactId: Contact['id']
}

export class EditAliasBodyDto {
  @IsNotEmpty()
  @IsString()
  new_alias: Contact['alias']
}
