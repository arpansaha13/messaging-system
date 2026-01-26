import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm'
import { UserProfile } from './user'
import { BaseEntity } from './base'

@Entity({ name: 'contacts' })
export class Contact extends BaseEntity {
  @Column({ name: 'user_id', nullable: false })
  userId!: number

  @ManyToOne(() => UserProfile, { nullable: false })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user!: UserProfile

  @Column({ name: 'user_id_in_contact', nullable: false })
  userIdInContact!: number

  @ManyToOne(() => UserProfile, { nullable: false })
  @JoinColumn({ name: 'user_id_in_contact', referencedColumnName: 'id' })
  userInContact!: UserProfile

  @Column({ type: 'varchar', nullable: false, default: '' })
  alias!: string
}
