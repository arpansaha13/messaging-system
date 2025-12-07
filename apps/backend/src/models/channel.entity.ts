import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm'
import { BaseEntity } from './base.entity'
import { Group } from './group.entity'

@Entity({ name: 'channels' })
export class Channel extends BaseEntity {
  @Column({ name: 'name', nullable: false })
  name!: string

  @ManyToOne(() => Group, { nullable: true })
  @JoinColumn({ name: 'group_id', referencedColumnName: 'id' })
  group?: Group
}
