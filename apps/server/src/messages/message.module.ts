import { Module } from '@nestjs/common'
import { MessageService } from './message.service'
import { MessageRepository } from './message.repository'
import { MessageController } from './message.controller'
import { ChatRepository } from 'src/chats/chats.repository'

@Module({
  controllers: [MessageController],
  providers: [ChatRepository, MessageRepository, MessageService],
  exports: [MessageRepository],
})
export class MessageModule {}
