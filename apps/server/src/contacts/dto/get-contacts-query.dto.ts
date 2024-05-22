import { IsOptional, IsNumber, IsString } from 'class-validator'

export class GetContactsQueryDto {
  @IsOptional()
  @IsString()
  search?: string
}
