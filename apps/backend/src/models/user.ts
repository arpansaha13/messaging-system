import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm'
import { BaseEntityNoPk } from './base'
import { Contact } from './contact'

@Entity({ name: 'user_profiles' })
export class UserProfile extends BaseEntityNoPk {
  @PrimaryColumn({ type: 'integer', name: 'id' })
  id!: number

  @Column({ type: 'varchar', name: 'global_name', nullable: false })
  globalName!: string

  @Column({ type: 'varchar', nullable: true })
  dp?: string

  @Column({ type: 'text', nullable: false, default: 'Hey there!' })
  bio!: string

  @OneToMany(() => Contact, contact => contact.user)
  contacts?: Contact[]
}
