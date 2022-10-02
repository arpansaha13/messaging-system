import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity()
export class UserEntity {
  /** A unique tag for the user. */
  @PrimaryGeneratedColumn('uuid')
  userTag: string

  /** Name set by the user. */
  @Column()
  name: string

  /** Profile photo set by the user. */
  @Column()
  dp: string | null

  /** A short bio set by the user. */
  @Column()
  bio: string
}
