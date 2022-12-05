import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { UserEntity } from '../users/user.entity'

@Entity({ name: 'contacts' })
export class ContactEntity {
  @PrimaryGeneratedColumn()
  id: number

  @ManyToOne(() => UserEntity, user => user.contacts)
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: UserEntity

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id_in_contact', referencedColumnName: 'id' })
  userInContact: UserEntity

  /** Alias or name by which the user has saved this contact. */
  @Column({ nullable: false })
  alias: string

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date

  @DeleteDateColumn({ nullable: true, type: 'timestamptz' })
  deleted_at: Date
}
