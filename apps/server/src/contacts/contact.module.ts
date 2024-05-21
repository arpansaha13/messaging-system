import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UserModule } from 'src/users/user.module'
import { Contact } from './contact.entity'
import { ContactService } from './contact.service'
import { ContactRepository } from './contact.repository'
import { ContactController } from './contact.controller'

@Module({
  imports: [UserModule, TypeOrmModule.forFeature([Contact])],
  controllers: [ContactController],
  providers: [ContactRepository, ContactService],
})
export class ContactModule {}
