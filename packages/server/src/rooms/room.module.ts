import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
// Auth Module
import { AuthModule } from 'src/auth/auth.module'
// Controller
import { ChatController } from './room.controller'
// Services
import { RoomService } from './room.service'
import { MessageService } from './messages.service'
// WebSocket Gateway
import { ChatsGateway } from './chats.gateway'
// Entities
import { RoomEntity } from './room.entity'
import { MessageEntity } from '../messages/message.entity'
import { UserEntity } from 'src/users/user.entity'

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, RoomEntity, MessageEntity]), AuthModule],
  controllers: [ChatController],
  providers: [RoomService, ChatsGateway, MessageService],
})
export class RoomModule {}
