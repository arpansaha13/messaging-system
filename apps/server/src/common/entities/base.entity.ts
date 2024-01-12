import { CreateDateColumn, DeleteDateColumn, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

export abstract class BaseEntity {
  @PrimaryGeneratedColumn()
  id: number

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date

  @DeleteDateColumn({ name: 'deleted_at', nullable: true, type: 'timestamptz' })
  deletedAt: Date
}
