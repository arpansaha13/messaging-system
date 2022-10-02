import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity()
export class MessageEntity {
  @PrimaryGeneratedColumn()
  rowNum: number

  /** Unique id for every chat between any two users. The chatId is used to identify which chat the message belongs to. */
  @Column()
  chatId: string

  /** Unique id for every message in a particular chat. */
  @Column()
  messageId: number

  /** The actual message that was sent. */
  @Column()
  message: string

  /** Time at which the message was sent. */
  @Column()
  time: number

  /** Status of the message. */
  @Column()
  status: MessageStatus

  /** User tag of the user who sent the message. */
  @Column()
  userTag: string
}

export enum MessageStatus {
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
}
