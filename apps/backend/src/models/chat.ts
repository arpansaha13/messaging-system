import { Column, Entity, ManyToOne, JoinColumn, PrimaryColumn } from 'typeorm'
import { UserProfile } from './user'

@Entity({ name: 'chats' })
export class Chat {
  @PrimaryColumn({ name: 'sender_id', type: 'bigint' })
  @ManyToOne(() => UserProfile)
  @JoinColumn({ name: 'sender_id', referencedColumnName: 'id' })
  sender_id!: number

  @PrimaryColumn({ name: 'receiver_id', type: 'bigint' })
  @ManyToOne(() => UserProfile)
  @JoinColumn({ name: 'receiver_id', referencedColumnName: 'id' })
  receiver_id!: number

  @Column({ name: 'cleared_at', type: 'timestamptz', nullable: false, default: () => "(timestamptz('now'))" })
  clearedAt!: Date

  @Column({ name: 'muted', type: 'boolean', default: false, nullable: false })
  muted!: boolean

  @Column({ name: 'archived', type: 'boolean', default: false, nullable: false })
  archived!: boolean

  @Column({ name: 'pinned', type: 'boolean', default: false, nullable: false })
  pinned!: boolean
}
