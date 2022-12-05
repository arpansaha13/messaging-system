import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

// Auth Module
import { AuthModule } from 'src/auth/auth.module'
// Controller
import { ContactController } from 'src/contacts/contact.controller'
// Service
import { ContactService } from 'src/contacts/contact.service'
// Entities
import { ContactEntity } from './contact.entity'
import { UserEntity } from 'src/users/user.entity'

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, ContactEntity]), AuthModule],
  controllers: [ContactController],
  providers: [ContactService],
})
export class ContactModule {}
