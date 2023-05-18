import { Exclude } from 'class-transformer'
import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm'

@Entity({ name: 'auth' })
export class AuthEntity {
  @PrimaryColumn({ name: 'user_id' })
  userId: number

  @Column({ unique: true })
  @Exclude({ toPlainOnly: true })
  password: string

  /** Time when the user account was created */
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  @Exclude({ toPlainOnly: true })
  createdAt: Date

  /** Time when the password was last updated */
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  @Exclude({ toPlainOnly: true })
  updatedAt: Date

  /** Time when the user account was deleted */
  @DeleteDateColumn({ name: 'deleted_at', nullable: true, type: 'timestamptz' })
  @Exclude({ toPlainOnly: true })
  deletedAt: Date
}
