import { IsNotEmpty, IsNumber } from 'class-validator'

export class GetUserByIdParamsDto {
  @IsNotEmpty()
  @IsNumber()
  userId: number
}
