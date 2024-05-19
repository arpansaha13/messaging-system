import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UserModule } from 'src/users/user.module'
import { ContactController } from 'src/contacts/contact.controller'
import { ContactService } from 'src/contacts/contact.service'
import { Contact } from './contact.entity'

@Module({
  imports: [UserModule, TypeOrmModule.forFeature([Contact])],
  controllers: [ContactController],
  providers: [ContactService],
})
export class ContactModule {}
