import { Column, Entity, PrimaryColumn } from 'typeorm'

@Entity()
export class AuthEntity {
  /** A unique tag for the user. This will never change for a user. */
  @PrimaryColumn()
  userTag: string

  /** Password for auth. */
  @Column({ unique: true })
  password: string
}
