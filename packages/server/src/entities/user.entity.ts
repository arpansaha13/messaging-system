import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity({ name: 'users' })
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number

  /** Display name set by the user. */
  @Column({ nullable: true })
  name: string

  /** Email id of the user. */
  @Column({ unique: true })
  email: string

  /** Profile photo set by the user. */
  @Column({ nullable: true })
  dp: string

  /** A short bio set by the user. */
  @Column({ nullable: true })
  about: string

  /** Time when the user account was created */
  @Column()
  created_at: Date

  /** Time when the user information was last updated */
  @Column()
  updated_at: Date

  /** Time when the user account was deleted */
  @Column({ nullable: true })
  deleted_at: Date
}
