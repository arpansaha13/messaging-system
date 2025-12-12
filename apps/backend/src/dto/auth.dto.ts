import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator'

export class LoginDto {
  @IsEmail()
  email!: string

  @IsString()
  @IsNotEmpty()
  password!: string
}

export class SignUpDto {
  @IsEmail()
  email!: string

  @IsString()
  @IsNotEmpty()
  globalName!: string

  @IsString()
  @MinLength(6)
  password!: string
}

export class VerifyAccountDto {
  @IsString()
  @IsNotEmpty()
  otp!: string
}
