import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { AuthModule } from 'src/auth/auth.module'

import { UserEntity } from 'src/users/user.entity'

import { ContactController } from 'src/contacts/contact.controller'
import { ContactService } from 'src/contacts/contact.service'
import { ContactEntity } from './contact.entity'

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, ContactEntity]), AuthModule],
  controllers: [ContactController],
  providers: [ContactService],
})
export class ContactModule {}
