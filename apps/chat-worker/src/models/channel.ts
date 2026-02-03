import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm'
import { BaseEntity } from './base'
import { Group } from './group'

@Entity({ name: 'channels' })
export class Channel extends BaseEntity {
  @Column({ type: 'varchar', name: 'name', nullable: false })
  name!: string

  @Column({ name: 'group_id', nullable: false })
  groupId!: number

  @ManyToOne(() => Group, { nullable: false })
  @JoinColumn({ name: 'group_id', referencedColumnName: 'id' })
  group!: Group
}
