import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm'
import { User } from './user.entity'
import { BaseEntity } from './base.entity'

@Entity({ name: 'contacts' })
export class Contact extends BaseEntity {
  @ManyToOne(() => User, user => user.contacts, { nullable: false })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: User

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'user_id_in_contact', referencedColumnName: 'id' })
  userInContact: User

  @Column({ type: 'varchar', nullable: false })
  alias: string
}
