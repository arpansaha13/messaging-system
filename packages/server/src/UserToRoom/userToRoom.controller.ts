import { Controller, Delete, Get, Param, Patch, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
// Entity
import { UserToRoom } from 'src/UserToRoom/UserToRoom.entity'
// Services
import { UserToRoomService } from 'src/UserToRoom/userToRoom.service'
// Custom Decorator
import { GetPayload } from 'src/common/decorators/getPayload.decorator'
// Types
import type { UserEntity } from 'src/users/user.entity'

@Controller('user-to-room')
@UseGuards(AuthGuard())
export class UserToRoomController {
  constructor(private readonly userToRoomService: UserToRoomService) {}

  @Get('/:roomId')
  async getUserToRoomById(
    @GetPayload('user') authUser: UserEntity,
    @Param('roomId') roomId: number,
  ): Promise<UserToRoom> {
    return this.userToRoomService.getUserToRoomEntity(authUser.id, roomId)
  }

  @Get('/rooms/unarchived')
  getUnarchivedUserToRooms(@GetPayload('user') authUser: UserEntity): Promise<UserToRoom[]> {
    return this.userToRoomService.getRoomsOfUser(authUser.id)
  }

  @Get('/rooms/archived')
  getArchivedUserToRooms(@GetPayload('user') authUser: UserEntity): Promise<UserToRoom[]> {
    return this.userToRoomService.getRoomsOfUser(authUser.id, true)
  }

  @Patch('/archive/:roomId')
  archiveRoom(@GetPayload('user') authUser: UserEntity, @Param('roomId') roomId: number): Promise<void> {
    return this.userToRoomService.updateArchive(authUser.id, roomId, true)
  }

  @Patch('/unarchive/:roomId')
  unarchiveRoom(@GetPayload('user') authUser: UserEntity, @Param('roomId') roomId: number): Promise<void> {
    return this.userToRoomService.updateArchive(authUser.id, roomId, false)
  }

  @Delete('/:roomId/clear-chat')
  clearChat(@GetPayload('user') authUser: UserEntity, @Param('roomId') roomId: number): Promise<void> {
    return this.userToRoomService.clearChat(authUser.id, roomId)
  }
}
