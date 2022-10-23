import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

// Auth Module
import { AuthModule } from 'src/auth/auth.module'
// Controller
import { ChatController } from 'src/chats/chat.controller'
// Service
import { ChatService } from 'src/chats/chat.service'
// Entities
import { ChatEntity } from 'src/chats/chat.entity'
import { MessageEntity } from 'src/entities/message.entity'

@Module({
  imports: [TypeOrmModule.forFeature([ChatEntity, MessageEntity]), AuthModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
