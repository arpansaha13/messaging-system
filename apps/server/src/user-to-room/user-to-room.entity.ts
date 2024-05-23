import { Column, ManyToOne, Entity, PrimaryGeneratedColumn, JoinColumn } from 'typeorm'

import { User } from 'src/users/user.entity'
import { Room } from 'src/rooms/room.entity'

@Entity({ name: 'user_to_room' })
export class UserToRoom {
  @PrimaryGeneratedColumn({ name: 'user_to_room_id' })
  userToRoomId: number

  @ManyToOne(() => User, user => user.rooms)
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: User

  @ManyToOne(() => Room, room => room.users)
  @JoinColumn({ name: 'room_id', referencedColumnName: 'id' })
  room: Room

  /**
   * Timestamp of the first message of this chat for a user.
   * The messages before this timestamp are cleared/deleted by the user.
   */
  @Column({ name: 'first_msg_tstamp', type: 'timestamptz', nullable: false, default: () => 'CURRENT_TIMESTAMP' })
  firstMsgTstamp: Date

  @Column({ name: 'is_muted', type: 'boolean', default: false, nullable: false })
  isMuted: boolean

  @Column({ name: 'archived', type: 'boolean', default: false, nullable: false })
  archived: boolean

  @Column({ name: 'pinned', type: 'boolean', default: false, nullable: false })
  pinned: boolean

  @Column({ name: 'deleted', type: 'boolean', default: false, nullable: false })
  deleted: boolean
}
