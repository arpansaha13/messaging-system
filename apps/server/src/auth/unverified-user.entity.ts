import { Column, Entity, PrimaryColumn } from 'typeorm'
import { BaseEntityNoPk } from 'src/common/entities/base.entity'

@Entity({ name: 'unverified_users' })
export class UnverifiedUser extends BaseEntityNoPk {
  @PrimaryColumn()
  hash: string

  @Column({ nullable: false })
  otp: string

  @Column({ name: 'global_name', nullable: false })
  globalName: string

  @Column({ name: 'username', nullable: false })
  username: string

  @Column({ unique: true, nullable: false })
  email: string

  @Column({ nullable: true })
  dp: string

  @Column({ nullable: false, default: 'Hey there! I am using WhatsApp.' })
  bio: string

  @Column({ nullable: false })
  password: string
}
