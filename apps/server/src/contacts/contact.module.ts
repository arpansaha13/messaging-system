import { Module } from '@nestjs/common'
import { ContactService } from './contact.service'
import { ContactRepository } from './contact.repository'
import { ContactController } from './contact.controller'
import { UserModule } from 'src/users/user.module'
import { UserRepository } from 'src/users/user.repository'

@Module({
  imports: [UserModule],
  controllers: [ContactController],
  providers: [ContactRepository, ContactService, UserRepository],
})
export class ContactModule {}
