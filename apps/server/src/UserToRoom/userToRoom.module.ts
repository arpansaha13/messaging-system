import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UserToRoom } from './UserToRoom.entity'
import { UserToRoomService } from './userToRoom.service'
import { UserToRoomController } from './userToRoom.controller'
import { UserToRoomRepository } from './userToRoom.repository'

@Module({
  imports: [TypeOrmModule.forFeature([UserToRoom])],
  controllers: [UserToRoomController],
  providers: [UserToRoomRepository, UserToRoomService],
  exports: [UserToRoomService],
})
export class UserToRoomModule {}
