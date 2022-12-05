import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
// Auth Module
import { AuthModule } from 'src/auth/auth.module'
// Controller
import { RoomController } from './room.controller'
// Services
import { RoomService } from './room.service'
import { UserToRoomService } from 'src/UserToRoom/userToRoom.service'
// Entities
import { RoomEntity } from './room.entity'
import { UserEntity } from 'src/users/user.entity'
import { UserToRoom } from 'src/UserToRoom/UserToRoom.entity'

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, UserToRoom, RoomEntity]), AuthModule],
  controllers: [RoomController],
  providers: [RoomService, UserToRoomService],
})
export class RoomModule {}
