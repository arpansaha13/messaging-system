import { Type } from 'class-transformer'
import { IsNotEmpty, IsNumber, IsString } from 'class-validator'

export class AddToContactDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  userIdToAdd: number

  @IsNotEmpty()
  @Type(() => String)
  @IsString()
  alias: string
}
