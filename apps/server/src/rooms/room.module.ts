import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { AuthModule } from 'src/auth/auth.module'
import { MessageModule } from 'src/messages/message.module'
import { UserToRoomModule } from 'src/UserToRoom/userToRoom.module'

import { User } from 'src/users/user.entity'
import { UserToRoom } from 'src/UserToRoom/UserToRoom.entity'

import { Room } from './room.entity'
import { RoomController } from './room.controller'
import { RoomService } from './room.service'

@Module({
  imports: [AuthModule, MessageModule, UserToRoomModule, TypeOrmModule.forFeature([User, Room, UserToRoom])],
  controllers: [RoomController],
  providers: [RoomService],
  exports: [RoomService],
})
export class RoomModule {}
