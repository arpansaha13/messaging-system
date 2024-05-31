import { Type } from 'class-transformer'
import { IsNotEmpty, IsNumber } from 'class-validator'

export class DeleteContactParamDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  contactId: number
}
