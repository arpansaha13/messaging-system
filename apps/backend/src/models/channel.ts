import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm'
import { BaseEntity } from './base'
import { Group } from './group'

@Entity({ name: 'channels' })
export class Channel extends BaseEntity {
  @Column({ type: 'varchar', name: 'name', nullable: false })
  name!: string

  @ManyToOne(() => Group, { nullable: true })
  @JoinColumn({ name: 'group_id', referencedColumnName: 'id' })
  group?: Group
}
