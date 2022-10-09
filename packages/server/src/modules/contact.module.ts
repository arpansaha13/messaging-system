import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

// Auth Module
import { AuthModule } from 'src/auth/auth.module'
// Controller
import { ContactController } from 'src/controllers/contact.controller'
// Service
import { ContactService } from 'src/services/contact.service'
// Entities
import { UserEntity } from 'src/entities/user.entity'
import { ContactEntity } from 'src/entities/contact.entity'

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, ContactEntity]), AuthModule],
  controllers: [ContactController],
  providers: [ContactService],
})
export class ContactModule {}
