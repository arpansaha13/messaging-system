import { IsNotEmpty, IsNumber } from 'class-validator'

export class ContactIdParamDto {
  @IsNotEmpty()
  @IsNumber()
  contactId: number
}
export class UserIdParamDto {
  @IsNotEmpty()
  @IsNumber()
  userId: number
}
