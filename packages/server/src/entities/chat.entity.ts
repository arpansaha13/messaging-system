import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity()
export class ChatEntity {
  /** Unique chat id for every chat. */
  @PrimaryGeneratedColumn('uuid')
  chatId: string

  /** Users in first column have chats with users in second column. */
  @Column()
  userTag1: string

  /** Users in first column have chats with users in second column. */
  @Column()
  userTag2: string

  // Whether the user1 has muted the chat with user2.
  @Column()
  muted: boolean
}
