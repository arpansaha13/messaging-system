import { IsNotEmpty, IsString } from 'class-validator'
import type { Group } from '../group.entity'

export class CreateGroupDto {
  @IsNotEmpty()
  @IsString()
  name: Group['name']
}
