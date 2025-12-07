import { Column, Entity, OneToMany } from 'typeorm'
import { BaseEntity } from './base.entity'
import { Contact } from './contact.entity'

@Entity({ name: 'users' })
export class User extends BaseEntity {
  @Column({ name: 'global_name', nullable: false })
  globalName!: string

  @Column({ name: 'username', unique: true, nullable: false })
  username!: string

  @Column({ unique: true, nullable: false })
  email!: string

  @Column({ nullable: true })
  dp?: string

  @Column({ nullable: false, default: 'Hey there!' })
  bio!: string

  @Column({ nullable: false })
  password!: string

  @OneToMany(() => Contact, contact => contact.user)
  contacts?: Contact[]
}
