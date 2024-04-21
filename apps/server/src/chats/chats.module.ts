import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { RoomModule } from 'src/rooms/room.module'
import { MessageModule } from 'src/messages/message.module'
import { UserToRoomModule } from 'src/UserToRoom/userToRoom.module'
import { User } from 'src/users/user.entity'
import { Room } from 'src/rooms/room.entity'
import { Message } from 'src/messages/message.entity'
import { UserToRoom } from 'src/UserToRoom/UserToRoom.entity'
import { ChatsGateway } from './chats.gateway'
import { ChatsService } from './chats.service';

@Module({
  imports: [RoomModule, MessageModule, UserToRoomModule, TypeOrmModule.forFeature([User, Room, Message, UserToRoom])],
  providers: [ChatsGateway, ChatsService],
})
export class ChatsModule {}
