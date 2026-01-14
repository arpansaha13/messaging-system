import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm'
import { BaseEntity } from './base'
import { Message } from './message'
import { MessageStatus } from '@shared/constants'
import { UserProfile } from './user'

@Entity({ name: 'message_recipients' })
export class MessageRecipient extends BaseEntity {
  @ManyToOne(() => Message, msg => msg.recipients, { nullable: false })
  @JoinColumn({ name: 'message_id', referencedColumnName: 'id' })
  message!: Message

  @Column({ name: 'status', type: 'varchar', nullable: false, default: MessageStatus.SENT })
  status!: MessageStatus

  @ManyToOne(() => UserProfile, { nullable: false })
  @JoinColumn({ name: 'receiver_id', referencedColumnName: 'id' })
  receiver!: UserProfile
}
