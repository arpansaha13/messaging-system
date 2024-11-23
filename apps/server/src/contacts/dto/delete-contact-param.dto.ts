import { Type } from 'class-transformer'
import { IsNotEmpty, IsNumber } from 'class-validator'
import type { Contact } from '../contact.entity'

export class DeleteContactParamDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  contactId: Contact['id']
}
