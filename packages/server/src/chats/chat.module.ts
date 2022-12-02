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
import { MessageEntity } from './message.entity'
import { UserEntity } from 'src/users/user.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, ChatEntity, MessageEntity]),
    AuthModule,
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatsGateway],
})
export class ChatModule {}
