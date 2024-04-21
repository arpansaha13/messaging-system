import { Controller, Get, Param, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { RoomService } from 'src/rooms/room.service'
import { MessageService } from 'src/messages/message.service'
import { UserToRoomService } from 'src/UserToRoom/userToRoom.service'
import { GetPayload } from 'src/common/decorators/getPayload.decorator'
import type { Room } from './room.entity'
import type { User } from 'src/users/user.entity'
import type { Message } from 'src/messages/message.entity'

@Controller('rooms')
@UseGuards(AuthGuard())
export class RoomController {
  constructor(
    private readonly roomService: RoomService,
    private readonly messageService: MessageService,
    private readonly userToRoomService: UserToRoomService,
  ) {}

  @Get('/:roomId')
  getRoomById(@Param('roomId') roomId: number): Promise<Room> {
    return this.roomService.getRoomById(roomId)
  }

  @Get('/:roomId/users')
  getUsersOfRoomById(@Param('roomId') roomId: number): Promise<User[]> {
    return this.roomService.getUsersOfRoomById(roomId)
  }

  @Get('/:roomId/messages')
  async getMessagesByRoomId(@GetPayload('user') authUser: User, @Param('roomId') roomId: number): Promise<Message[]> {
    const authUserToRoom = await this.userToRoomService.getUserToRoom(authUser.id, roomId)
    return this.messageService.getMessagesByRoomId(roomId, authUserToRoom.firstMsgTstamp)
  }

  @Get('/:roomId/messages/latest')
  async getLatestMsgByRoomId(@GetPayload('user') authUser: User, @Param('roomId') roomId: number): Promise<Message> {
    const userToRoom = await this.userToRoomService.getUserToRoom(authUser.id, roomId)
    return this.messageService.getLatestMsgByRoomId(roomId, userToRoom.firstMsgTstamp)
  }
}
