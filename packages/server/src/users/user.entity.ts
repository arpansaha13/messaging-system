import { Exclude } from 'class-transformer'
import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

@Entity({ name: 'users' })
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number

  /** Display name set by the user. This is not a username. */
  @Column({ nullable: true })
  name: string

  /** Email id of the user. */
  @Column({ unique: true })
  @Exclude({ toPlainOnly: true })
  email: string

  /** Profile photo set by the user. */
  @Column({ nullable: true })
  dp: string

  /** A short bio set by the user. */
  @Column({ nullable: false, default: 'Hey there! I am using WhatsApp.' })
  bio: string

  /** Time when the user account was created */
  @CreateDateColumn({ type: 'timestamptz' })
  @Exclude({ toPlainOnly: true })
  created_at: Date

  /** Time when the user information was last updated */
  @UpdateDateColumn({ type: 'timestamptz' })
  @Exclude({ toPlainOnly: true })
  updated_at: Date

  /** Time when the user account was deleted */
  @DeleteDateColumn({ nullable: true, type: 'timestamptz' })
  @Exclude({ toPlainOnly: true })
  deleted_at: Date
}
