import { Entity, JoinColumn, ManyToOne, Column } from 'typeorm'
import { BaseEntity } from './base'
import { UserProfile } from './user'
import { Group } from './group'

@Entity({ name: 'user_groups' })
export class UserGroup extends BaseEntity {
  @Column({ name: 'user_id', nullable: false })
  userId!: number

  @ManyToOne(() => UserProfile, { nullable: false })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user!: UserProfile

  @Column({ name: 'group_id', nullable: false })
  groupId!: number

  @ManyToOne(() => Group, { nullable: false })
  @JoinColumn({ name: 'group_id', referencedColumnName: 'id' })
  group!: Group
}
