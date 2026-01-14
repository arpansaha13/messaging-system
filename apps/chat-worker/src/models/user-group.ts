import { Entity, JoinColumn, ManyToOne } from 'typeorm'
import { BaseEntity } from './base'
import { UserProfile } from './user'
import { Group } from './group'

@Entity({ name: 'user_group' })
export class UserGroup extends BaseEntity {
  @ManyToOne(() => UserProfile, { nullable: false })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user!: UserProfile

  @ManyToOne(() => Group, { nullable: false })
  @JoinColumn({ name: 'group_id', referencedColumnName: 'id' })
  group!: Group
}
