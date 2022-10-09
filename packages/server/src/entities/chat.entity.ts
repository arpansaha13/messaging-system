import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm'

@Entity({ name: 'chats' })
export class ChatEntity {
  @PrimaryGeneratedColumn()
  id: number

  /** User with the first-person perspective in a chat. This is the authorized/logged-in user */
  @Column()
  user: number

  /** User-id of the second-person perspective in a chat. */
  @Column()
  sec_person: number

  /** Timestamp of the first message of this chat for the first-person user. If a user performs "clear-chat", this timestamp will help to identify which messages to show. If this field is `null`, then the user does not have any messages in this chat, either because the user has cleared the chat, or they never chatted. */
  @Column({ nullable: true })
  first_msg_tstamp: Date

  /** Whether the user1 has muted the chat with user2. */
  @Column()
  is_muted: boolean

  /** Time when the chat was created */
  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date

  /** Time when the chat was deleted */
  @DeleteDateColumn({ nullable: true, type: 'timestamptz' })
  deleted_at: Date
}
