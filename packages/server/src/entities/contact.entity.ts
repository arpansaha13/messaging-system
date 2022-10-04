import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity()
export class ContactEntity {
  @PrimaryGeneratedColumn()
  rowNum: number

  /** Users in first column have the users in second column in their contacts. */
  @Column()
  userTag1: string

  /** Users in first column have the users in second column in their contacts. */
  @Column()
  userTag2: string

  /** Alias by which the user1 has saved user2 in contacts. */
  @Column({ default: null })
  alias: string | null
}
