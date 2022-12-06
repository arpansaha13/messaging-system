import { Controller, Get, Param, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
// Services
import { RoomService } from 'src/rooms/room.service'
import { MessageService } from 'src/messages/message.service'
import { UserToRoomService } from 'src/UserToRoom/userToRoom.service'
// Custom Decorator
import { GetPayload } from 'src/common/decorators/getPayload.decorator'
// DTO
import { RoomIdParamDto } from './dto/RoomIdParam.dto'
// Types
import type { RoomEntity } from './room.entity'
import type { UserEntity } from 'src/users/user.entity'
import type { MessageEntity } from 'src/messages/message.entity'

@Controller('rooms')
@UseGuards(AuthGuard())
export class RoomController {
  constructor(
    private readonly roomService: RoomService,
    private readonly messageService: MessageService,
    private readonly userToRoomService: UserToRoomService,
  ) {}

  @Get('/:roomId')
  getRoomById(@Param() params: RoomIdParamDto): Promise<RoomEntity> {
    return this.roomService.getRoomById(params.roomId)
  }

  @Get('/:roomId/messages')
  async getMessagesByRoomId(
    @GetPayload('user') authUser: UserEntity,
    @Param() params: RoomIdParamDto,
  ): Promise<MessageEntity[]> {
    const userToRoomEntity = await this.userToRoomService.getUserToRoomEntity(authUser.id, params.roomId)
    return this.messageService.getMessagesByRoomId(params.roomId, userToRoomEntity.firstMsgTstamp)
  }

  @Get('/:roomId/messages/latest')
  async getLatestMsgByRoomId(
    @GetPayload('user') authUser: UserEntity,
    @Param() params: RoomIdParamDto,
  ): Promise<MessageEntity> {
    const userToRoomEntity = await this.userToRoomService.getUserToRoomEntity(authUser.id, params.roomId)
    return this.messageService.getLatestMsgByRoomId(params.roomId, userToRoomEntity.firstMsgTstamp)
  }
}
