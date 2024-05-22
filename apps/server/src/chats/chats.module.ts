import { Module } from '@nestjs/common'
import { RoomModule } from 'src/rooms/room.module'
import { MessageModule } from 'src/messages/message.module'
import { UserToRoomModule } from 'src/user-to-room/user-to-room.module'
import { MessageRepository } from 'src/messages/message.repository'
import { ChatsGateway } from './chats.gateway'
import { ChatsService } from './chats.service'

@Module({
  imports: [RoomModule, MessageModule, UserToRoomModule],
  providers: [ChatsGateway, ChatsService, MessageRepository],
})
export class ChatsModule {}
