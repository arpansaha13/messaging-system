import { Column, CreateDateColumn, DeleteDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { UserToRoom } from 'src/user-to-room/user-to-room.entity'
import { Message } from 'src/messages/message.entity'

@Entity({ name: 'rooms' })
export class Room {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ name: 'is_group', default: false, nullable: false })
  isGroup: boolean

  @OneToMany(() => UserToRoom, userToRoom => userToRoom.room)
  users: UserToRoom[]

  @OneToMany(() => Message, message => message.room)
  messages: Message[]

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date

  @DeleteDateColumn({ name: 'deleted_at', nullable: true, type: 'timestamptz' })
  deletedAt: Date
}
