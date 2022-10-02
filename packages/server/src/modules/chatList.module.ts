import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
// Controller
import { ChatListController } from 'src/controllers/chatList.controller'
// Services
import { UserService } from 'src/services/user.service'
import { ChatService } from 'src/services/chat.service'
import { ContactService } from 'src/services/contact.service'
import { ChatListService } from 'src/services/chatList.service'
// Entities
import { UserEntity } from 'src/entities/user.entity'
import { ChatEntity } from 'src/entities/chat.entity'
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
  ],
  controllers: [ChatListController],
  providers: [ChatListService, ContactService, UserService, ChatService],
})
export class ChatListModule {}
