import { Exclude } from 'class-transformer'
import { Column, Entity, OneToMany } from 'typeorm'
import { Contact } from 'src/contacts/contact.entity'
import { UserToRoom } from 'src/UserToRoom/UserToRoom.entity'
import { BaseEntity } from 'src/common/entities/base.entity'

@Entity({ name: 'users' })
export class User extends BaseEntity {
  @Column({ name: 'global_name', nullable: false })
  globalName: string

  @Column({ unique: true, nullable: false })
  email: string

  @Column({ nullable: true })
  dp: string

  @Column({ nullable: false, default: 'Hey there! I am using WhatsApp.' })
  bio: string

  @Column({ nullable: false })
  @Exclude({ toPlainOnly: true })
  password: string

  @OneToMany(() => Contact, contact => contact.user)
  contacts: Contact[]

  @OneToMany(() => UserToRoom, userToRoom => userToRoom.user)
  rooms: UserToRoom[]
}
