import { IsEmail, IsNotEmpty, MaxLength, MinLength } from 'class-validator'

export class SignUpDto {
  @IsNotEmpty()
  @IsEmail()
  email: string

  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(30)
  password: string

  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(20)
  displayName: string
}

export class SignInDto {
  @IsNotEmpty()
  @IsEmail()
  email: string

  @IsNotEmpty()
  password: string
}
