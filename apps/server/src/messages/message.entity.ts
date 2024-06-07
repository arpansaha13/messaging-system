import { Column, Entity, JoinColumn, ManyToOne, OneToMany, type Relation } from 'typeorm'
import { BaseEntity } from 'src/common/entities/base.entity'
import { User } from 'src/users/user.entity'
import { MessageRecipient } from 'src/message-recipient/message-recipient.entity'

@Entity({ name: 'messages' })
export class Message extends BaseEntity {
  @Column({ nullable: false })
  content: string

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'sender_id', referencedColumnName: 'id' })
  sender: Relation<User>

  @OneToMany(() => MessageRecipient, recipient => recipient.message)
  recipients: Relation<MessageRecipient>[]
}
