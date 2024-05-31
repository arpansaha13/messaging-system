import { Module } from '@nestjs/common'
import { ContactService } from './contact.service'
import { ContactRepository } from './contact.repository'
import { ContactController } from './contact.controller'

@Module({
  controllers: [ContactController],
  providers: [ContactRepository, ContactService],
})
export class ContactModule {}
