import { Controller, Get, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
// Services
import { RoomService } from 'src/rooms/room.service'
// Custom Decorator
import { GetPayload } from 'src/common/decorators/getPayload.decorator'
// Types
import type { UserEntity } from 'src/users/user.entity'

@Controller('rooms')
@UseGuards(AuthGuard())
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Get()
  async getAllRoomsOfUser(@GetPayload('user') authUser: UserEntity): Promise<UserEntity> {
    return this.roomService.get1to1RoomsWithReceiver(authUser.id)
  }
  @Get('/archived')
  async getArchivedRoomsOfUser(@GetPayload('user') authUser: UserEntity): Promise<UserEntity> {
    return this.roomService.get1to1RoomsWithReceiver(authUser.id, true)
  }

  // @Get('/clear/:userId')
  // clearChat(@Param() params: GetChatParamsDto, @GetPayload('user') userEntity: UserEntity): Promise<void> {
  //   return this.roomService.clearChat(userEntity.id, params.userId)
  // }
}
