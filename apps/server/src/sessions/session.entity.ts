import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm'

@Entity({ name: 'sessions' })
export class Session {
  @PrimaryGeneratedColumn('uuid')
  key: string

  @Column({ type: 'text' })
  token: string

  @Column({ name: 'expires_at' })
  expiresAt: Date
}
