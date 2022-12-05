import { Column, CreateDateColumn, DeleteDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm'

import { UserToRoom } from 'src/UserToRoom/UserToRoom.entity'
import { MessageEntity } from 'src/messages/message.entity'

@Entity({ name: 'rooms' })
export class RoomEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ name: 'is_group', default: false, nullable: false })
  isGroup: boolean

  @OneToMany(() => UserToRoom, userToRoom => userToRoom.user)
  users: UserToRoom[]

  @OneToMany(() => MessageEntity, message => message.room)
  messages: MessageEntity[]

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date

  @DeleteDateColumn({ name: 'deleted_at', nullable: true, type: 'timestamptz' })
  deletedAt: Date
}
