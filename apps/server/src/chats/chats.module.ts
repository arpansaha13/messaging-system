import { Module } from '@nestjs/common'
import { ChatsGateway } from './chats.gateway'
import { ChatsService } from './chats.service'
import { ChatsWsService } from './chats.ws.service'
import { ChatRepository } from './chats.repository'
import { ChatsController } from './chats.controller'
import { UserModule } from 'src/users/user.module'
import { ContactModule } from 'src/contacts/contact.module'
import { MessageModule } from 'src/messages/message.module'
import { MessageRecipientModule } from 'src/message-recipient/message-recipient.module'

@Module({
  imports: [ContactModule, MessageModule, MessageRecipientModule, UserModule],
  providers: [ChatRepository, ChatsGateway, ChatsService, ChatsWsService],
  controllers: [ChatsController],
  exports: [ChatRepository],
})
export class ChatsModule {}
