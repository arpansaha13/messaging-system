import { Entity, JoinColumn, ManyToOne } from 'typeorm'
import { BaseEntity } from './base'
import { User } from './user'
import { Group } from './group'

@Entity({ name: 'user_group' })
export class UserGroup extends BaseEntity {
  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user!: User

  @ManyToOne(() => Group, { nullable: false })
  @JoinColumn({ name: 'group_id', referencedColumnName: 'id' })
  group!: Group
}
