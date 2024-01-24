import { IsOptional, IsString } from 'class-validator'
import { User } from '../user.entity'

export class UpdateUserInfoDto {
  @IsOptional()
  @IsString()
  bio?: User['bio']

  @IsOptional()
  @IsString()
  dp?: User['dp']

  @IsOptional()
  @IsString()
  displayName?: User['displayName']
}
