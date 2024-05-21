import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator'
import { IsAlphaWithSpaces } from 'src/common/decorators/is-alpha-with-spaces.decorator'
import { User } from '../user.entity'

export class UpdateUserInfoDto {
  @IsOptional()
  @IsString()
  bio?: User['bio']

  @IsOptional()
  @IsString()
  dp?: User['dp']

  @IsOptional()
  @MinLength(1)
  @MaxLength(20)
  @IsAlphaWithSpaces({ message: 'Name should only contain alphabets and spaces' })
  globalName?: User['globalName']
}
