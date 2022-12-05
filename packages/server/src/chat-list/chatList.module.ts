import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

// Auth Module
import { AuthModule } from 'src/auth/auth.module'
// Controller
import { ChatListController } from 'src/chat-list/chatList.controller'
// Services
import { UserService } from 'src/users/user.service'
import { RoomService } from 'src/rooms/room.service'
import { MessageService } from 'src/rooms/messages.service'
import { ContactService } from 'src/contacts/contact.service'
import { ChatListService } from 'src/chat-list/chatList.service'
// Entities
import { UserEntity } from 'src/users/user.entity'
import { RoomEntity } from 'src/rooms/room.entity'
import { MessageEntity } from 'src/messages/message.entity'
import { ContactEntity } from 'src/contacts/contact.entity'

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, RoomEntity, MessageEntity, ContactEntity]), AuthModule],
  controllers: [ChatListController],
  providers: [ChatListService, ContactService, UserService, RoomService, MessageService],
})
export class ChatListModule {}
