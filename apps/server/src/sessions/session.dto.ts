import { IsString, IsDate, IsNotEmpty } from 'class-validator'

export class CreateSessionDto {
  @IsString()
  @IsNotEmpty()
  token: string

  @IsDate()
  @IsNotEmpty()
  expiresAt: Date
}
