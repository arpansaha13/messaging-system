import { Module } from '@nestjs/common'
import { ChatsGateway } from './chats.gateway'
import { ChatsService } from './chats.service'
import { ChatRepository } from './chats.repository'
import { ChatsController } from './chats.controller'
import { GroupChatsWsService } from './group-chats.ws.service'
import { PersonalChatsWsService } from './personal-chats.ws.service'
import { UserModule } from 'src/users/user.module'
import { ContactModule } from 'src/contacts/contact.module'
import { MessageModule } from 'src/messages/message.module'
import { MessageRecipientModule } from 'src/message-recipient/message-recipient.module'

@Module({
  imports: [ContactModule, MessageModule, MessageRecipientModule, UserModule],
  providers: [ChatRepository, ChatsGateway, ChatsService, GroupChatsWsService, PersonalChatsWsService],
  controllers: [ChatsController],
  exports: [ChatRepository],
})
export class ChatsModule {}
