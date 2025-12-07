import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm'
import { BaseEntity } from './base.entity'
import { User } from './user.entity'
import { Channel } from './channel.entity'

@Entity({ name: 'groups' })
export class Group extends BaseEntity {
  @Column({ name: 'name', nullable: false })
  name!: string

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'founder_id', referencedColumnName: 'id' })
  founder!: User

  @OneToMany(() => Channel, channel => channel.group)
  channels?: Channel[]
}
