import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity({ name: 'contacts' })
export class ContactEntity {
  @PrimaryGeneratedColumn()
  id: number

  /** The first-person (authorized/logged-in) user who has stored the sec-person in their contacts. */
  @Column()
  user: number

  /** The sec-person user who is stored by the first-person in their contacts. */
  @Column()
  contact: number

  /** Alias or name by which the first-person user has saved the sec-person in contacts. */
  @Column({ default: null })
  alias: string | null

  @Column()
  created_at: Date

  @Column()
  updated_at: Date

  @Column({ nullable: true })
  deleted_at: Date
}
