import { Type } from 'class-transformer'
import { IsNotEmpty, IsNumber, IsString, Matches } from 'class-validator'
import type { User } from 'src/users/user.entity'
import type { Contact } from '../contact.entity'

export class AddContactDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  userIdToAdd: User['id']

  @IsNotEmpty()
  @Type(() => String)
  @IsString()
  @Matches(/^[a-zA-Z0-9.,() ]*$/, {
    message: 'Aliases should be alphanumeric with spaces, dots, commas, or parenthesis',
  })
  alias: Contact['alias']
}
