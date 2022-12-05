import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

// Auth Module
import { AuthModule } from 'src/auth/auth.module'
// Controller
import { MessageController } from './message.controller'
// Services
import { MessageService } from './messages.service'
import { UserToRoomService } from 'src/UserToRoom/userToRoom.service'
// Entity
import { UserToRoom } from 'src/UserToRoom/UserToRoom.entity'
import { MessageEntity } from './message.entity'

@Module({
  imports: [TypeOrmModule.forFeature([MessageEntity, UserToRoom]), AuthModule],
  controllers: [MessageController],
  providers: [MessageService, UserToRoomService],
})
export class MessageModule {}
