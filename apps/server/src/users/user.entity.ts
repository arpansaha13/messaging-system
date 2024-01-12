import { Exclude } from 'class-transformer'
import { Column, Entity, OneToMany } from 'typeorm'
import { ContactEntity } from 'src/contacts/contact.entity'
import { UserToRoom } from 'src/UserToRoom/UserToRoom.entity'
import { BaseEntity } from 'src/common/entities/base.entity'

@Entity({ name: 'users' })
export class UserEntity extends BaseEntity {
  @Column({ name: 'display_name', nullable: false })
  displayName: string

  @Column({ unique: true, nullable: false })
  email: string

  @Column({ nullable: true })
  dp: string

  @Column({ nullable: false, default: 'Hey there! I am using WhatsApp.' })
  bio: string

  @Column({ nullable: false })
  @Exclude({ toPlainOnly: true })
  password: string

  @OneToMany(() => ContactEntity, contact => contact.user)
  contacts: ContactEntity[]

  @OneToMany(() => UserToRoom, userToRoom => userToRoom.user)
  rooms: UserToRoom[]
}
