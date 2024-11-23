import { Column, Entity, JoinColumn, ManyToOne, type Relation } from 'typeorm'
import { BaseEntity } from 'src/common/entities/base.entity'
import { Group } from 'src/groups/group.entity'

@Entity({ name: 'channels' })
export class Channel extends BaseEntity {
  @Column({ name: 'name', nullable: false })
  name: string

  @ManyToOne(() => Group, { nullable: true })
  @JoinColumn({ name: 'group_id', referencedColumnName: 'id' })
  group: Relation<Group>
}
