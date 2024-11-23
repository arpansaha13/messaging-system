import { Column, Entity, JoinColumn, ManyToOne, OneToMany, type Relation } from 'typeorm'
import { BaseEntity } from 'src/common/entities/base.entity'
import { User } from 'src/users/user.entity'
import { Channel } from 'src/channels/channel.entity'

@Entity({ name: 'groups' })
export class Group extends BaseEntity {
  @Column({ name: 'name', nullable: false })
  name: string

  @ManyToOne(() => User, user => user.contacts, { nullable: false })
  @JoinColumn({ name: 'founder_id', referencedColumnName: 'id' })
  founder: Relation<User>

  @OneToMany(() => Channel, channel => channel.group)
  channels: Relation<Channel>[]
}
