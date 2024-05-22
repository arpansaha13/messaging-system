import { Module } from '@nestjs/common'
import { UserToRoomService } from './user-to-room.service'
import { UserToRoomController } from './user-to-room.controller'
import { UserToRoomRepository } from './user-to-room.repository'

@Module({
  controllers: [UserToRoomController],
  providers: [UserToRoomRepository, UserToRoomService],
  exports: [UserToRoomService],
})
export class UserToRoomModule {}
