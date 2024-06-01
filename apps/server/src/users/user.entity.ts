import { Column, Entity, OneToMany, type Relation } from 'typeorm'
import { BaseEntity } from 'src/common/entities/base.entity'
import { Contact } from 'src/contacts/contact.entity'

@Entity({ name: 'users' })
export class User extends BaseEntity {
  @Column({ name: 'global_name', nullable: false })
  globalName: string

  @Column({ name: 'username', nullable: false })
  username: string

  @Column({ unique: true, nullable: false })
  email: string

  @Column({ nullable: true })
  dp: string

  @Column({ nullable: false, default: 'Hey there! I am using WhatsApp.' })
  bio: string

  @Column({ nullable: false })
  password: string

  @OneToMany(() => Contact, contact => contact.user)
  contacts: Relation<Contact>[]
}
