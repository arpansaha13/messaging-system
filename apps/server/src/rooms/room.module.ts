import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { MessageModule } from 'src/messages/message.module'
import { UserToRoomModule } from 'src/user-to-room/user-to-room.module'
import { User } from 'src/users/user.entity'
import { UserRepository } from 'src/users/user.repository'
import { UserToRoom } from 'src/user-to-room/user-to-room.entity'
import { Room } from './room.entity'
import { RoomService } from './room.service'
import { RoomRepository } from './room.repository'
import { RoomController } from './room.controller'

@Module({
  imports: [MessageModule, UserToRoomModule, TypeOrmModule.forFeature([User, Room, UserToRoom])],
  controllers: [RoomController],
  providers: [RoomRepository, UserRepository, RoomService],
  exports: [RoomService],
})
export class RoomModule {}
