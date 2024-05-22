import { Module } from '@nestjs/common'
import { MessageModule } from 'src/messages/message.module'
import { UserToRoomModule } from 'src/user-to-room/user-to-room.module'
import { UserRepository } from 'src/users/user.repository'
import { RoomService } from './room.service'
import { RoomRepository } from './room.repository'
import { RoomController } from './room.controller'

@Module({
  imports: [MessageModule, UserToRoomModule],
  controllers: [RoomController],
  providers: [RoomRepository, UserRepository, RoomService],
  exports: [RoomService],
})
export class RoomModule {}
