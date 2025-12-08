import { Column, Entity, PrimaryColumn } from 'typeorm'
import { BaseEntityNoPk } from './base.entity'

@Entity({ name: 'unverified_users' })
export class UnverifiedUser extends BaseEntityNoPk {
  @PrimaryColumn({ type: 'varchar' })
  hash!: string

  @Column({ type: 'varchar', nullable: false })
  otp!: string

  @Column({ type: 'varchar', name: 'global_name', nullable: false })
  globalName!: string

  @Column({ type: 'varchar', name: 'username', nullable: false })
  username!: string

  @Column({ type: 'varchar', unique: true, nullable: false })
  email!: string

  @Column({ type: 'varchar', nullable: true })
  dp?: string

  @Column({ type: 'text', nullable: false, default: 'Hey there!.' })
  bio!: string

  @Column({ type: 'varchar', nullable: false })
  password!: string
}
