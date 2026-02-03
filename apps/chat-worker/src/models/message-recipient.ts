import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm'
import { BaseEntity } from './base'
import { Message } from './message'
import { MessageStatus } from '@shared/constants'
import { UserProfile } from './user'

@Entity({ name: 'message_recipients' })
export class MessageRecipient extends BaseEntity {
  @Column({ name: 'message_id', nullable: false })
  messageId!: number

  @ManyToOne(() => Message, msg => msg.recipients, { nullable: false })
  @JoinColumn({ name: 'message_id', referencedColumnName: 'id' })
  message!: Message

  @Column({ name: 'receiver_id', nullable: false })
  receiverId!: number

  @ManyToOne(() => UserProfile, { nullable: false })
  @JoinColumn({ name: 'receiver_id', referencedColumnName: 'id' })
  receiver!: UserProfile

  @Column({ name: 'status', type: 'smallint', nullable: false, default: MessageStatus.SENT })
  status!: MessageStatus
}
