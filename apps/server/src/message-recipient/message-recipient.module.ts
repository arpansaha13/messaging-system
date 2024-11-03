import { Module } from '@nestjs/common'
import { MessageRecipientRepository } from './message-recipient.repository'

@Module({
  providers: [MessageRecipientRepository],
  exports: [MessageRecipientRepository],
})
export class MessageRecipientModule {}
