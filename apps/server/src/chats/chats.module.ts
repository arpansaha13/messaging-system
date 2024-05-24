import { Module } from '@nestjs/common'
import { MessageRepository } from 'src/messages/message.repository'
import { ChatsGateway } from './chats.gateway'
import { ChatsService } from './chats.service'
import { ChatRepository } from './chats.repository'
import { ChatsController } from './chats.controller'
import { ContactRepository } from 'src/contacts/contact.repository'

@Module({
  providers: [ContactRepository, ChatsGateway, ChatRepository, ChatsService, MessageRepository],
  controllers: [ChatsController],
})
export class ChatsModule {}
