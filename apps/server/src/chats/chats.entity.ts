import { Column, ManyToOne, Entity, PrimaryGeneratedColumn, JoinColumn } from 'typeorm'
import { User } from 'src/users/user.entity'

@Entity({ name: 'chats' })
export class Chat {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number

  @ManyToOne(() => User)
  @JoinColumn({ name: 'sender_id', referencedColumnName: 'id' })
  sender: User

  @ManyToOne(() => User)
  @JoinColumn({ name: 'receiver_id', referencedColumnName: 'id' })
  receiver: User

  /**
   * Timestamp of the first message of this chat for a user.
   * The messages before this timestamp are cleared/deleted by the user.
   */
  @Column({ name: 'first_msg_tstamp', type: 'timestamptz', nullable: false, default: () => 'CURRENT_TIMESTAMP' })
  firstMsgTstamp: Date

  @Column({ name: 'muted', type: 'boolean', default: false, nullable: false })
  muted: boolean

  @Column({ name: 'archived', type: 'boolean', default: false, nullable: false })
  archived: boolean

  @Column({ name: 'pinned', type: 'boolean', default: false, nullable: false })
  pinned: boolean
}
