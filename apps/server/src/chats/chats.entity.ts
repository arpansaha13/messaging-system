import { Column, ManyToOne, Entity, PrimaryGeneratedColumn, JoinColumn, type Relation } from 'typeorm'
import { User } from 'src/users/user.entity'

@Entity({ name: 'chats' })
export class Chat {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'sender_id', referencedColumnName: 'id' })
  sender: Relation<User>

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'receiver_id', referencedColumnName: 'id' })
  receiver: Relation<User>

  @Column({ name: 'cleared_at', type: 'timestamptz', nullable: false, default: () => 'CURRENT_TIMESTAMP' })
  clearedAt: Date

  @Column({ name: 'muted', type: 'boolean', default: false, nullable: false })
  muted: boolean

  @Column({ name: 'archived', type: 'boolean', default: false, nullable: false })
  archived: boolean

  @Column({ name: 'pinned', type: 'boolean', default: false, nullable: false })
  pinned: boolean
}
