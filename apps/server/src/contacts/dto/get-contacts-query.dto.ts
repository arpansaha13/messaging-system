import { Type } from 'class-transformer'
import { IsOptional, IsNumber } from 'class-validator'

export class GetContactsQueryDto {
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  contactId?: number

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  userId?: number
}
