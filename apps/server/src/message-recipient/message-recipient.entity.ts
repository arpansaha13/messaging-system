import { Message } from 'src/messages/message.entity'
import { Column, Entity, JoinColumn, ManyToOne, type Relation } from 'typeorm'
import { BaseEntity } from 'src/common/entities/base.entity'
import { User } from 'src/users/user.entity'

export enum MessageStatus {
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
}

@Entity({ name: 'message_recipients' })
export class MessageRecipient extends BaseEntity {
  @ManyToOne(() => Message, msg => msg.recipients, { nullable: false })
  @JoinColumn({ name: 'message_id', referencedColumnName: 'id' })
  message: Relation<Message>

  @Column({ name: 'status', nullable: false, default: MessageStatus.SENT })
  status: MessageStatus

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'receiver_id', referencedColumnName: 'id' })
  receiver: User
}
