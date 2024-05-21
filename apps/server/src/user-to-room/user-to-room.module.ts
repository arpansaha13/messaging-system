import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UserToRoom } from './user-to-room.entity'
import { UserToRoomService } from './user-to-room.service'
import { UserToRoomController } from './user-to-room.controller'
import { UserToRoomRepository } from './user-to-room.repository'

@Module({
  imports: [TypeOrmModule.forFeature([UserToRoom])],
  controllers: [UserToRoomController],
  providers: [UserToRoomRepository, UserToRoomService],
  exports: [UserToRoomService],
})
export class UserToRoomModule {}
