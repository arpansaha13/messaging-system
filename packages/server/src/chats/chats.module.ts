import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
// Entity
import { UserEntity } from 'src/users/user.entity'
import { RoomEntity } from 'src/rooms/room.entity'
import { MessageEntity } from 'src/messages/message.entity'
import { UserToRoom } from 'src/UserToRoom/UserToRoom.entity'
// Services
import { MessageService } from 'src/messages/messages.service'
import { UserToRoomService } from 'src/UserToRoom/userToRoom.service'
import { RoomService } from 'src/rooms/room.service'
// WebSocket Gateway
import { ChatsGateway } from './chats.gateway'

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, RoomEntity, MessageEntity, UserToRoom])],
  providers: [RoomService, ChatsGateway, MessageService, UserToRoomService],
})
export class ChatsModule {}
