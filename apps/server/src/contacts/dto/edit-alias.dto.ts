import { Type } from 'class-transformer'
import { IsNotEmpty, IsNumber, IsString } from 'class-validator'

export class EditAliasParamDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  contactId: number
}

export class EditAliasBodyDto {
  @IsNotEmpty()
  @IsString()
  new_alias: string
}
