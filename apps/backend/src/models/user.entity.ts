import { Column, Entity, OneToMany } from 'typeorm'
import { BaseEntity } from './base.entity'
import { Contact } from './contact.entity'

@Entity({ name: 'users' })
export class User extends BaseEntity {
  @Column({ type: 'varchar', name: 'global_name', nullable: false })
  globalName!: string

  @Column({ type: 'varchar', name: 'username', unique: true, nullable: false })
  username!: string

  @Column({ type: 'varchar', unique: true, nullable: false })
  email!: string

  @Column({ type: 'varchar', nullable: true })
  dp?: string

  @Column({ type: 'text', nullable: false, default: 'Hey there!' })
  bio!: string

  @Column({ type: 'varchar', nullable: false })
  password!: string

  @OneToMany(() => Contact, contact => contact.user)
  contacts?: Contact[]
}
