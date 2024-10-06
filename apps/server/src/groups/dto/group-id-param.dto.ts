import { Type } from 'class-transformer'
import { IsNotEmpty, IsNumber } from 'class-validator'
import type { Group } from 'src/groups/group.entity'

export class GroupIdParam {
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  groupId: Group['id']
}
