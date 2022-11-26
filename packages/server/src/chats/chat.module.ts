import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

// Auth Module
import { AuthModule } from 'src/auth/auth.module'
// Controller
import { ChatController } from './chat.controller'
// Service
import { ChatService } from './chat.service'
// WebSocket Gateway
import { ChatsGateway } from './chats.gateway'
// Entities
import { ChatEntity } from './chat.entity'
import { MessageEntity } from 'src/entities/message.entity'

@Module({
  imports: [TypeOrmModule.forFeature([ChatEntity, MessageEntity]), AuthModule],
  controllers: [ChatController],
  providers: [ChatService, ChatsGateway],
})
export class ChatModule {}
