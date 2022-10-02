import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

// Controller
import { ChatController } from 'src/controllers/chat.controller'
// Service
import { ChatService } from 'src/services/chat.service'
// Entity
import { ChatEntity } from 'src/entities/chat.entity'
import { MessageEntity } from 'src/entities/message.entity'

@Module({
  imports: [TypeOrmModule.forFeature([ChatEntity, MessageEntity])],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
