import { IsOptional, IsString } from 'class-validator'
import { UserEntity } from '../user.entity'

export class UpdateUserInfoDto {
  @IsOptional()
  @IsString()
  bio?: UserEntity['bio']

  @IsOptional()
  @IsString()
  dp?: UserEntity['dp']

  @IsOptional()
  @IsString()
  displayName?: UserEntity['displayName']
}
