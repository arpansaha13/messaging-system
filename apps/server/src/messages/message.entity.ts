import { Column, Entity, JoinColumn, ManyToOne, OneToMany, type Relation } from 'typeorm'
import { BaseEntity } from 'src/common/entities/base.entity'
import { User } from 'src/users/user.entity'
import { Channel } from 'src/channels/channel.entity'
import { MessageRecipient } from 'src/message-recipient/message-recipient.entity'

@Entity({ name: 'messages' })
export class Message extends BaseEntity {
  @Column({ nullable: false })
  content: string

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'sender_id', referencedColumnName: 'id' })
  sender: Relation<User>

  @ManyToOne(() => Channel, { nullable: true })
  @JoinColumn({ name: 'channel_id', referencedColumnName: 'id' })
  channel: Relation<Channel>

  @OneToMany(() => MessageRecipient, recipient => recipient.message)
  recipients: Relation<MessageRecipient>[]
}
