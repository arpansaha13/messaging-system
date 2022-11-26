import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm'

@Entity({ name: 'messages' })
export class MessageEntity {
  @PrimaryGeneratedColumn()
  id: number

  /** Unique id for every chat between any two users. The chat_id is used to identify which chat the message belongs to. */
  @Column({ nullable: false })
  chat_id: number

  /** The actual message that was sent. */
  @Column({ nullable: false })
  message: string

  /** Status of the message. */
  @Column({ nullable: false })
  status: MessageStatus

  /** Id of the user who sent the message. */
  @Column({ nullable: false })
  sender_id: number

  /** If this message was deleted by one of the participants of the chat, then `deleted_by` will contain the id of the user who deleted this message. If `deleted_by` is negative (-1), then this message was deleted by both participants. If `deleted_by` is `null`, then this message was not deleted by either participant. */
  @Column({ nullable: true, type: 'integer' })
  deleted_by: number | null

  /** Time at which the message was sent. */
  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date

  /** Messages cannot be edited (yet?) */
  // @UpdateDateColumn({ type: 'timestamptz' })
  // updated_at: Date

  /** Time at which the message was deleted */
  @DeleteDateColumn({ nullable: true, type: 'timestamptz' })
  deleted_at: Date
}

export enum MessageStatus {
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
}
