import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm'
import { UserProfile } from './user'
import { BaseEntity } from './base'

@Entity({ name: 'contacts' })
export class Contact extends BaseEntity {
  @ManyToOne(() => UserProfile, user => user.contacts, { nullable: false })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: UserProfile

  @ManyToOne(() => UserProfile, { nullable: false })
  @JoinColumn({ name: 'user_id_in_contact', referencedColumnName: 'id' })
  userInContact: UserProfile

  @Column({ type: 'varchar', nullable: false })
  alias: string
}
