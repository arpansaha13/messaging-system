import { Column, Entity, ManyToOne, JoinColumn, PrimaryColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { UserProfile } from './user'

@Entity({ name: 'chats' })
export class Chat {
  @PrimaryColumn({ name: 'sender_id' })
  senderId!: number

  @ManyToOne(() => UserProfile, { nullable: false })
  @JoinColumn({ name: 'sender_id', referencedColumnName: 'id' })
  sender!: UserProfile

  @PrimaryColumn({ name: 'receiver_id' })
  receiverId!: number

  @ManyToOne(() => UserProfile, { nullable: false })
  @JoinColumn({ name: 'receiver_id', referencedColumnName: 'id' })
  receiver!: UserProfile

  @Column({ name: 'muted', type: 'boolean', default: false, nullable: false })
  muted!: boolean

  @Column({ name: 'archived', type: 'boolean', default: false, nullable: false })
  archived!: boolean

  @Column({ name: 'pinned', type: 'boolean', default: false, nullable: false })
  pinned!: boolean

  @Column({ name: 'cleared_at', type: 'timestamptz', nullable: true })
  clearedAt?: Date

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date
}
