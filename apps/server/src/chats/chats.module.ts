import { Module } from '@nestjs/common'
import { ChatsGateway } from './chats.gateway'
import { ChatsService } from './chats.service'
import { ChatsWsService } from './chats.ws.service'
import { ChatRepository } from './chats.repository'
import { ChatsController } from './chats.controller'
import { ContactRepository } from 'src/contacts/contact.repository'
import { UserRepository } from 'src/users/user.repository'
import { MessageRepository } from 'src/messages/message.repository'
import { MessageRecipientRepository } from 'src/message-recipient/message-recipient.repository'

@Module({
  providers: [
    ChatRepository,
    ChatsGateway,
    ChatsService,
    ChatsWsService,
    ContactRepository,
    MessageRepository,
    MessageRecipientRepository,
    UserRepository,
  ],
  controllers: [ChatsController],
})
export class ChatsModule {}
