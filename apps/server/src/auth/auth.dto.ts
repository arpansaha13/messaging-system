import { IsEmail, IsNotEmpty, IsStrongPassword, MaxLength, MinLength } from 'class-validator'
import { Match } from 'src/common/decorators/match.decorator'
import { IsAlphaWithSpaces } from 'src/common/decorators/is-alpha-with-spaces.decorator'
import type { User } from 'src/users/user.entity'
import type { UnverifiedUser } from './unverified-user.entity'

export class SignUpDto {
  @IsNotEmpty()
  @IsEmail()
  email: User['email']

  // TODO: Allow username to be edited. Use this validator there.
  // @MinLength(4)
  // @MaxLength(20)
  // @Matches(/^[A-Za-z0-9_]+$/, { message: 'Username can only contain letters, numbers. and underscores.' })
  // username: string

  @IsNotEmpty()
  @MaxLength(30)
  @IsStrongPassword(
    {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    },
    {
      message: ({ value }: { value: string }) => {
        if (value.length < 8) return 'Password is too short.'
        if (!/[a-z]/.test(value)) return 'Password must have at least one lowercase alphabet'
        if (!/[A-Z]/.test(value)) return 'Password must have at least one uppercase alphabet'
        if (!/[0-9]/.test(value)) return 'Password must have at least one number'
        if (!/[|\\/~^:,;?!&%$@*+]/.test(value)) return 'Password must have at least one symbol'
      },
    },
  )
  password: User['password']

  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(30)
  @Match('password', { message: 'Password and confirm-password do not match.' })
  confirmPassword: User['password']

  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(20)
  @IsAlphaWithSpaces({ message: 'Name should only contain alphabets and spaces' })
  globalName: User['globalName']
}

export class LoginDto {
  @IsNotEmpty()
  @IsEmail()
  email: User['email']

  @IsNotEmpty()
  password: User['password']
}

export class VerifyAccountDto {
  @IsNotEmpty()
  otp: UnverifiedUser['otp']
}

export class VerifyAccountParams {
  @IsNotEmpty()
  hash: UnverifiedUser['hash']
}
