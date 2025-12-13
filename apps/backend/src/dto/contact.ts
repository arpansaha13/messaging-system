import { IsInt, IsNotEmpty, IsString, Min, MinLength } from 'class-validator'

export class CreateContactDto {
  @IsInt()
  @Min(1)
  userIdToAdd!: number

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  alias!: string
}

export class UpdateContactDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  new_alias!: string
}
