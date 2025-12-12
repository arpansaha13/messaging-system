import { IsNumberString } from 'class-validator'

export class ReceiverParamDto {
  @IsNumberString()
  receiverId!: number
}
