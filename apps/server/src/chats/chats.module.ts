import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { RoomModule } from 'src/rooms/room.module'
import { MessageModule } from 'src/messages/message.module'
import { UserToRoomModule } from 'src/UserToRoom/userToRoom.module'

import { UserEntity } from 'src/users/user.entity'
import { RoomEntity } from 'src/rooms/room.entity'
import { MessageEntity } from 'src/messages/message.entity'
import { UserToRoom } from 'src/UserToRoom/UserToRoom.entity'

import { ChatsGateway } from './chats.gateway'

@Module({
  imports: [
    RoomModule,
    MessageModule,
    UserToRoomModule,
    TypeOrmModule.forFeature([UserEntity, RoomEntity, MessageEntity, UserToRoom]),
  ],
  providers: [ChatsGateway],
})
export class ChatsModule {}
