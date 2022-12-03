import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity({ name: 'chats' })
export class ChatEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  participant_1: number

  @Column()
  participant_2: number

  /**
   * Timestamp of the first message of this chat for a user. If a user performs "clear-chat", this timestamp will help to identify which messages to show. If this field is `null`, then the user does not have any messages in this chat, either because the user has cleared the chat, or they never chatted.
   */
  @Column({ name: 'first_msg_tstamp', type: 'jsonb' })
  firstMsgTstamp: { [key: number]: Date | null }

  /** Whether the user has muted the chat room. */
  @Column({ name: 'is_muted', type: 'jsonb' })
  isMuted: { [key: number]: boolean }

  /** Whether the user has archived the chat room. */
  @Column({ name: 'archived', type: 'jsonb' })
  archived: { [key: number]: boolean }

  /** Whether the user has archived the chat room. */
  @Column({ name: 'deleted', type: 'jsonb' })
  deleted: { [key: number]: boolean }

  /** Time when the chat was created */
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date

  /** Time when the chat was deleted */
  @DeleteDateColumn({ name: 'deleted_at', nullable: true, type: 'timestamptz' })
  deletedAt: Date
}
