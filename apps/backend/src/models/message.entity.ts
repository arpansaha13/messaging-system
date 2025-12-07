import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm'
import { BaseEntity } from './base.entity'
import { User } from './user.entity'
import { Channel } from './channel.entity'
import { MessageRecipient } from './message-recipient.entity'

@Entity({ name: 'messages' })
export class Message extends BaseEntity {
  @Column({ nullable: false })
  content!: string

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'sender_id', referencedColumnName: 'id' })
  sender!: User

  @ManyToOne(() => Channel, { nullable: true })
  @JoinColumn({ name: 'channel_id', referencedColumnName: 'id' })
  channel?: Channel

  @OneToMany(() => MessageRecipient, recipient => recipient.message)
  recipients?: MessageRecipient[]
}
