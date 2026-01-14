import { Entity, Column, ManyToOne, JoinColumn, PrimaryColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { UserProfile } from './user'
import { Group } from './group'

@Entity({ name: 'invites' })
export class Invite {
  @PrimaryColumn({ type: 'varchar' })
  hash!: string

  @ManyToOne(() => UserProfile, { nullable: false })
  @JoinColumn({ name: 'inviter_id', referencedColumnName: 'id' })
  inviter!: UserProfile

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
