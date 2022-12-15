import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
// Entities
import { UserToRoom } from 'src/UserToRoom/UserToRoom.entity'
// Types
import type { Repository } from 'typeorm'

@Injectable()
export class UserToRoomService {
  constructor(
    @InjectRepository(UserToRoom)
    private userToRoomRepository: Repository<UserToRoom>,
  ) {}

  async getUserToRoomEntity(authUserId: number, roomId: number): Promise<UserToRoom> {
    return this.userToRoomRepository.findOne({
      where: {
        user: { id: authUserId },
        room: { id: roomId },
      },
    })
  }

  async getRoomsOfUser(authUserId: number, archived = false): Promise<UserToRoom[]> {
    return this.userToRoomRepository.find({
      where: {
        user: { id: authUserId },
        archived,
      },
      relations: { room: true },
    })
  }

  async updateFirstMsgTstamp(authUserId: number, roomId: number, newValue: string): Promise<void> {
    await this.userToRoomRepository.update(
      {
        user: { id: authUserId },
        room: { id: roomId },
      },
      { firstMsgTstamp: new Date(newValue) },
    )
  }
  async clearChat(authUserId: number, roomId: number): Promise<void> {
    await this.updateFirstMsgTstamp(authUserId, roomId, null)
  }
  async updateArchive(authUserId: number, roomId: number, newValue: boolean): Promise<void> {
    await this.userToRoomRepository.update(
      {
        user: { id: authUserId },
        room: { id: roomId },
      },
      { archived: newValue },
    )
  }
}
