import { Entity, Column, ManyToOne, JoinColumn, PrimaryColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm'
import { User } from './user.entity'
import { Group } from './group.entity'

@Entity({ name: 'invites' })
export class Invite {
  @PrimaryColumn({ type: 'varchar' })
  hash!: string

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'inviter_id', referencedColumnName: 'id' })
  inviter!: User

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
