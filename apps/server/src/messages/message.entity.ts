import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'

import { Room } from 'src/rooms/room.entity'

export enum MessageStatus {
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
}

@Entity({ name: 'messages' })
export class Message {
  @PrimaryGeneratedColumn()
  id: number

  @ManyToOne(() => Room, room => room.messages)
  @JoinColumn({ name: 'room_id' })
  room: Room

  @Column({ nullable: false })
  content: string

  @Column({ nullable: false, default: MessageStatus.SENT })
  status: MessageStatus

  @Column({ name: 'sender_id', nullable: false })
  senderId: number

  @Column({ name: 'deleted_by', type: 'jsonb' })
  deletedBy: { [key: string]: boolean }

  @Column({ name: 'deleted_for_everyone', type: 'boolean', default: false })
  deletedForEveryone: boolean

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date

  /** Messages cannot be edited (yet?) */
  // @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  // updated_at: Date

  @DeleteDateColumn({ name: 'deleted_at', nullable: true, type: 'timestamptz' })
  deletedAt: Date
}
