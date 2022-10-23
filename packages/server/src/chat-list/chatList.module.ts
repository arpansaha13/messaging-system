import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

// Auth Module
import { AuthModule } from 'src/auth/auth.module'
// Controller
import { ChatListController } from 'src/chat-list/chatList.controller'
// Services
import { UserService } from 'src/users/user.service'
import { ChatService } from 'src/chats/chat.service'
import { ContactService } from 'src/contacts/contact.service'
import { ChatListService } from 'src/chat-list/chatList.service'
// Entities
import { UserEntity } from 'src/users/user.entity'
import { ChatEntity } from 'src/chats/chat.entity'
import { ContactEntity } from 'src/entities/contact.entity'
import { MessageEntity } from 'src/entities/message.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      ChatEntity,
      MessageEntity,
      ContactEntity,
    ]),
    AuthModule,
  ],
  controllers: [ChatListController],
  providers: [ChatListService, ContactService, UserService, ChatService],
})
export class ChatListModule {}
