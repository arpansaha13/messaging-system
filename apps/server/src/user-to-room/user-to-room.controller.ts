import { Controller, Delete, Param, Patch, Req, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { UserToRoomService } from 'src/user-to-room/user-to-room.service'
import { RoomIdParam } from 'src/rooms/dto/room-id-param.dto'
import type { Request } from 'express'

@Controller('user-to-room')
@UseGuards(AuthGuard())
export class UserToRoomController {
  constructor(private readonly userToRoomService: UserToRoomService) {}

  @Patch('/:roomId/archive')
  archiveRoom(@Req() request: Request, @Param() params: RoomIdParam): Promise<void> {
    return this.userToRoomService.updateArchive(request.user.id, params.roomId, true)
  }

  @Patch('/:roomId/unarchive')
  unarchiveRoom(@Req() request: Request, @Param() params: RoomIdParam): Promise<void> {
    return this.userToRoomService.updateArchive(request.user.id, params.roomId, false)
  }

  @Patch('/:roomId/pin-chat')
  pinChat(@Req() request: Request, @Param() params: RoomIdParam): Promise<void> {
    return this.userToRoomService.updatePin(request.user.id, params.roomId, true)
  }

  @Patch('/:roomId/unpin-chat')
  unpinChat(@Req() request: Request, @Param() params: RoomIdParam): Promise<void> {
    return this.userToRoomService.updatePin(request.user.id, params.roomId, false)
  }

  @Delete('/:roomId/clear-chat')
  clearChat(@Req() request: Request, @Param() params: RoomIdParam): Promise<void> {
    return this.userToRoomService.clearChat(request.user.id, params.roomId)
  }

  @Delete('/:roomId/delete-chat')
  deleteChat(@Req() request: Request, @Param() params: RoomIdParam): Promise<void> {
    return this.userToRoomService.deleteChat(request.user.id, params.roomId)
  }
}
