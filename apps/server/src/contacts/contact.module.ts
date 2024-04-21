import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthModule } from 'src/auth/auth.module'
import { UserModule } from 'src/users/user.module'
import { ContactController } from 'src/contacts/contact.controller'
import { ContactService } from 'src/contacts/contact.service'
import { Contact } from './contact.entity'

@Module({
  imports: [AuthModule, UserModule, TypeOrmModule.forFeature([Contact])],
  controllers: [ContactController],
  providers: [ContactService],
})
export class ContactModule {}
