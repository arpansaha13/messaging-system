import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm'
import { UserProfile } from './user'
import { Group } from './group'

@Entity({ name: 'invites' })
export class Invite {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({ name: 'inviter_id', nullable: false })
  inviterId!: number

  @ManyToOne(() => UserProfile, { nullable: false })
  @JoinColumn({ name: 'inviter_id', referencedColumnName: 'id' })
  inviter!: UserProfile

  @Column({ name: 'group_id', nullable: true })
  groupId?: number

  @ManyToOne(() => Group, { nullable: true })
  @JoinColumn({ name: 'group_id', referencedColumnName: 'id' })
  group?: Group

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date

  @Column({ name: 'expires_at', nullable: true, type: 'timestamptz' })
  expiresAt?: Date
}
