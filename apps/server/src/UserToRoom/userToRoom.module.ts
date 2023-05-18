import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { AuthModule } from 'src/auth/auth.module'
import { UserToRoom } from 'src/UserToRoom/UserToRoom.entity'
import { UserToRoomController } from './userToRoom.controller'
import { UserToRoomService } from 'src/UserToRoom/userToRoom.service'

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([UserToRoom])],
  controllers: [UserToRoomController],
  providers: [UserToRoomService],
  exports: [UserToRoomService],
})
export class UserToRoomModule {}
