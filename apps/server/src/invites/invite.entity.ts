import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  type Relation,
} from 'typeorm'
import { User } from 'src/users/user.entity'
import { Group } from 'src/groups/group.entity'

@Entity({ name: 'invites' })
export class Invite {
  @PrimaryColumn({ nullable: false })
  hash: string

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'inviter_id', referencedColumnName: 'id' })
  inviter: Relation<User>

  @ManyToOne(() => Group, { nullable: true })
  @JoinColumn({ name: 'group_id', referencedColumnName: 'id' })
  group: Relation<Group>

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date

  /** The same column can be used for both soft-delete and expiry */
  @Column({ name: 'expires_at', nullable: true, type: 'timestamptz' })
  expiresAt: Date
}
