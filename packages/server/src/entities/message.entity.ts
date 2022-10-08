import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity()
export class MessageEntity {
  @PrimaryGeneratedColumn()
  id: number

  /** Unique id for every chat between any two users. The chat_id is used to identify which chat the message belongs to. */
  @Column()
  chat_id: number

  /** The actual message that was sent. */
  @Column()
  message: string

  /** Status of the message. */
  @Column()
  status: MessageStatus

  /** Id of the user who sent the message. */
  @Column()
  sender_id: number

  /** If this message was deleted by one of the participants of the chat, then `deleted_by` will contain the id of the user who deleted this message. If `deleted_by` is negative (-1), then this message was deleted by both participants. If `deleted_by` is `null`, then this message was not deleted by either participant. */
  @Column({ nullable: true, type: 'integer' })
  deleted_by: number

  /** Time at which the message was sent. */
  @Column()
  created_at: Date

  /** Messages cannot be edited (yet?) */
  // @Column()
  // updated_at: Date

  /** Time at which the message was deleted */
  @Column({ nullable: true })
  deleted_at: Date
}

export enum MessageStatus {
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
}
