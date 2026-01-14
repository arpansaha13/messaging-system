import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm'
import { BaseEntity } from './base'
import { UserProfile } from './user'
import { Channel } from './channel'
import { MessageRecipient } from './message-recipient'

@Entity({ name: 'messages' })
export class Message extends BaseEntity {
  @Column({ type: 'text', nullable: false })
  content!: string

  @ManyToOne(() => UserProfile, { nullable: false })
  @JoinColumn({ name: 'sender_id', referencedColumnName: 'id' })
  sender!: UserProfile

  @ManyToOne(() => Channel, { nullable: true })
  @JoinColumn({ name: 'channel_id', referencedColumnName: 'id' })
  channel?: Channel

  @OneToMany(() => MessageRecipient, recipient => recipient.message)
  recipients?: MessageRecipient[]
}
