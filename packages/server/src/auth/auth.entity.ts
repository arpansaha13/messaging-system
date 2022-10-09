import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm'

@Entity({ name: 'auth' })
export class AuthEntity {
  @PrimaryColumn()
  user_id: number

  @Column({ unique: true })
  password: string

  /** Time when the user account was created */
  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date

  /** Time when the password was last updated */
  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date

  /** Time when the user account was deleted */
  @DeleteDateColumn({ nullable: true, type: 'timestamptz' })
  deleted_at: Date
}
