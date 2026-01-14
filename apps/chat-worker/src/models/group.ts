import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm'
import { BaseEntity } from './base'
import { UserProfile } from './user'
import { Channel } from './channel'

@Entity({ name: 'groups' })
export class Group extends BaseEntity {
  @Column({ type: 'varchar', name: 'name', nullable: false })
  name!: string

  @ManyToOne(() => UserProfile, { nullable: false })
  @JoinColumn({ name: 'founder_id', referencedColumnName: 'id' })
  founder!: UserProfile

  @OneToMany(() => Channel, channel => channel.group)
  channels?: Channel[]
}
