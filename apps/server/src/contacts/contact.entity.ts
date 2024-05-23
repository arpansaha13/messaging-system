import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm'
import { User } from '../users/user.entity'
import { BaseEntity } from 'src/common/entities/base.entity'

@Entity({ name: 'contacts' })
export class Contact extends BaseEntity {
  @ManyToOne(() => User, user => user.contacts)
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: User

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id_in_contact', referencedColumnName: 'id' })
  userInContact: User

  /** Alias or name by which the user has saved this contact. */
  @Column({ nullable: false })
  alias: string
}
