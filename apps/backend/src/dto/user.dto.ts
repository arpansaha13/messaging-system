import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator'

export class CreateUserDto {
  @IsEmail()
  email!: string

  @IsString()
  @MinLength(1)
  globalName!: string

  @IsString()
  @MinLength(1)
  username!: string

  @IsString()
  @MinLength(6)
  password!: string

  @IsOptional()
  @IsString()
  bio?: string
}

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string

  @IsOptional()
  @IsString()
  @MinLength(1)
  globalName?: string

  @IsOptional()
  @IsString()
  @MinLength(1)
  username?: string

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string

  @IsOptional()
  @IsString()
  bio?: string
}
