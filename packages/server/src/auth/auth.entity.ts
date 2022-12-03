import { Exclude } from 'class-transformer'
import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm'

@Entity({ name: 'auth' })
export class AuthEntity {
  @PrimaryColumn()
  user_id: number

  @Column({ unique: true })
  @Exclude({ toPlainOnly: true })
  password: string

  /** Time when the user account was created */
  @CreateDateColumn({ type: 'timestamptz' })
  @Exclude({ toPlainOnly: true })
  created_at: Date

  /** Time when the password was last updated */
  @UpdateDateColumn({ type: 'timestamptz' })
  @Exclude({ toPlainOnly: true })
  updated_at: Date

  /** Time when the user account was deleted */
  @DeleteDateColumn({ nullable: true, type: 'timestamptz' })
  @Exclude({ toPlainOnly: true })
  deleted_at: Date
}
