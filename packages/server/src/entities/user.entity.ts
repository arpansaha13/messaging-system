import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity()
export class UserEntity {
  /** A unique tag for the user. This will never change for a user. */
  @PrimaryGeneratedColumn('uuid')
  userTag: string

  /** Name set by the user. */
  @Column({ unique: true })
  username: string

  /** Email id of the user. */
  @Column({ unique: true })
  email: string

  /** Profile photo set by the user. */
  @Column({ default: null })
  dp: string | null

  /** A short bio set by the user. */
  @Column({ default: '' })
  bio: string
}
