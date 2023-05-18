import { Controller, Delete, Get, Param, Patch, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
// Entity
import { UserToRoom } from 'src/UserToRoom/UserToRoom.entity'
// Services
import { UserToRoomService } from 'src/UserToRoom/userToRoom.service'
// Custom Decorator
import { GetPayload } from 'src/common/decorators/getPayload.decorator'
// DTO
import { RoomIdParam } from 'src/rooms/dto/room-id-param.dto'
// Types
import type { UserEntity } from 'src/users/user.entity'

@Controller('user-to-room')
@UseGuards(AuthGuard())
export class UserToRoomController {
  constructor(private readonly userToRoomService: UserToRoomService) {}

  @Get('/:roomId')
  getUserToRoomById(@GetPayload('user') authUser: UserEntity, @Param('roomId') roomId: number): Promise<UserToRoom> {
    return this.userToRoomService.getUserToRoomEntity(authUser.id, roomId)
  }

  @Get('/rooms/unarchived')
  getUnarchivedUserToRooms(@GetPayload('user') authUser: UserEntity): Promise<UserToRoom[]> {
    return this.userToRoomService.getRoomsOfUser(authUser.id)
  }

  @Get('/rooms/archived')
  async getArchivedUserToRooms(@GetPayload('user') authUser: UserEntity): Promise<UserToRoom[]> {
    return this.userToRoomService.getRoomsOfUser(authUser.id, true)
  }

  @Patch('/archive/:roomId')
  archiveRoom(@GetPayload('user') authUser: UserEntity, @Param() params: RoomIdParam): Promise<void> {
    return this.userToRoomService.updateArchive(authUser.id, params.roomId, true)
  }

  @Patch('/unarchive/:roomId')
  unarchiveRoom(@GetPayload('user') authUser: UserEntity, @Param() params: RoomIdParam): Promise<void> {
    return this.userToRoomService.updateArchive(authUser.id, params.roomId, false)
  }

  @Patch('/:roomId/pin-chat')
  pinChat(@GetPayload('user') authUser: UserEntity, @Param() params: RoomIdParam): Promise<void> {
    return this.userToRoomService.updatePin(authUser.id, params.roomId, true)
  }

  @Patch('/:roomId/unpin-chat')
  unpinChat(@GetPayload('user') authUser: UserEntity, @Param() params: RoomIdParam): Promise<void> {
    return this.userToRoomService.updatePin(authUser.id, params.roomId, false)
  }

  @Delete('/:roomId/clear-chat')
  clearChat(@GetPayload('user') authUser: UserEntity, @Param() params: RoomIdParam): Promise<void> {
    return this.userToRoomService.clearChat(authUser.id, params.roomId)
  }

  @Delete('/:roomId/delete-chat')
  deleteChat(@GetPayload('user') authUser: UserEntity, @Param() params: RoomIdParam): Promise<void> {
    return this.userToRoomService.deleteChat(authUser.id, params.roomId)
  }
}
