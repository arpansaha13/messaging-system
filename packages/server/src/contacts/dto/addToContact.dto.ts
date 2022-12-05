import { Type } from 'class-transformer'
import { IsNotEmpty, IsNumber } from 'class-validator'

export class AddToContactDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  userIdToAdd: number

  @IsNotEmpty()
  alias: string
}
