import { Type } from 'class-transformer'
import { IsNotEmpty, IsNumber, IsString, Matches } from 'class-validator'

export class AddToContactDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  userIdToAdd: number

  @IsNotEmpty()
  @Type(() => String)
  @IsString()
  @Matches(/^[a-zA-Z0-9.,()]*$/, { message: 'Aliases should be alphanumeric with dots, commas, or parenthesis' })
  alias: string
}
