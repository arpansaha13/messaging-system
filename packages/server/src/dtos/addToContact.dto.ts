import { Type } from 'class-transformer'
import { IsNotEmpty, IsNumber } from 'class-validator'

export class AddToContactDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  contact_user_id: number

  @IsNotEmpty()
  alias: string
}
