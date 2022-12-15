// import { Exclude } from 'class-transformer'
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'

import { ContactEntity } from 'src/contacts/contact.entity'
import { UserToRoom } from 'src/UserToRoom/UserToRoom.entity'

@Entity({ name: 'users' })
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ name: 'display_name', nullable: true })
  displayName: string

  @Column({ unique: true, nullable: false })
  // @Exclude({ toPlainOnly: true })
  email: string

  @Column({ nullable: true })
  dp: string

  @Column({ nullable: false, default: 'Hey there! I am using WhatsApp.' })
  bio: string

  @OneToMany(() => ContactEntity, contact => contact.user)
  contacts: ContactEntity[]

  @OneToMany(() => UserToRoom, userToRoom => userToRoom.user)
  rooms: UserToRoom[]

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  // @Exclude({ toPlainOnly: true })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  // @Exclude({ toPlainOnly: true })
  updatedAt: Date

  @DeleteDateColumn({ name: 'deleted_at', nullable: true, type: 'timestamptz' })
  // @Exclude({ toPlainOnly: true })
  deletedAt: Date
}
