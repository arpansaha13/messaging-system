import { Column, ManyToOne, Entity, PrimaryGeneratedColumn, JoinColumn } from 'typeorm'

import { UserEntity } from 'src/users/user.entity'
import { RoomEntity } from 'src/rooms/room.entity'

@Entity({ name: 'user_to_room' })
export class UserToRoom {
  @PrimaryGeneratedColumn({ name: 'user_to_room_id' })
  userToRoomId: number

  @ManyToOne(() => UserEntity, user => user.rooms)
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: UserEntity

  @ManyToOne(() => RoomEntity, room => room.users)
  @JoinColumn({ name: 'room_id', referencedColumnName: 'id' })
  room: RoomEntity

  /**
   * Timestamp of the first message of this chat for a user. If a user performs "clear-chat", this timestamp will help to identify which messages to show. If this field is `null`, then the user does not have any messages in this chat, either because the user has cleared the chat, or they never chatted.
   */
  @Column({ name: 'first_msg_tstamp', type: 'timestamptz', nullable: true, default: null })
  firstMsgTstamp: Date | null

  @Column({ name: 'is_muted', type: 'boolean', default: false, nullable: false })
  isMuted: boolean

  @Column({ name: 'archived', type: 'boolean', default: false, nullable: false })
  archived: boolean

  @Column({ name: 'pinned', type: 'boolean', default: false, nullable: false })
  pinned: boolean

  @Column({ name: 'deleted', type: 'boolean', default: false, nullable: false })
  deleted: boolean
}
