import { Exclude } from 'class-transformer'
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import { UserEntity } from './user.entity'

@Entity({ name: 'contacts' })
export class ContactEntity {
  @PrimaryGeneratedColumn()
  id: number

  /**
   * The first-person (authorized/logged-in) user who has stored the sec-person in their contacts.
   *
   * It is not required to send this column to the client because it will aways be the user_id of logged-in user.
   */
  @Column()
  @Exclude({ toPlainOnly: true })
  user: number

  /**
   * The sec-person **user_id** who is stored by the first-person in their contacts.
   *
   * The data of this user will be automatically fetched from user's table (`eager=true`).
   */
  @ManyToOne(() => UserEntity, user => user.id, { eager: true })
  contact: number

  /** Alias or name by which the first-person user has saved the sec-person in contacts. */
  @Column()
  alias: string

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date

  @DeleteDateColumn({ nullable: true, type: 'timestamptz' })
  deleted_at: Date
}
