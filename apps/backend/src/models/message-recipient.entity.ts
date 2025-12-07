import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm'
import { BaseEntity } from './base.entity'
import { Message } from './message.entity'
import { User } from './user.entity'
import { MessageStatus } from '@shared/constants'

@Entity({ name: 'message_recipients' })
export class MessageRecipient extends BaseEntity {
  @ManyToOne(() => Message, msg => msg.recipients, { nullable: false })
  @JoinColumn({ name: 'message_id', referencedColumnName: 'id' })
  message!: Message

  @Column({ name: 'status', type: 'varchar', nullable: false, default: MessageStatus.SENT })
  status!: MessageStatus

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'receiver_id', referencedColumnName: 'id' })
  receiver!: User
}
