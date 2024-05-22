import { Module } from '@nestjs/common'
import { MessageService } from './message.service'
import { MessageRepository } from './message.repository'
import { MessageController } from './message.controller'
import { UserToRoomRepository } from 'src/user-to-room/user-to-room.repository'

@Module({
  controllers: [MessageController],
  providers: [MessageRepository, MessageService, UserToRoomRepository],
  exports: [MessageService],
})
export class MessageModule {}
