import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm'

@Entity({ name: 'sessions' })
export class Session {
  @PrimaryGeneratedColumn('uuid')
  key: string

  @Column({ type: 'text', nullable: false })
  token: string

  @Column({ name: 'expires_at', nullable: false })
  expiresAt: Date
}
