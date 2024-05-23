import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Not } from 'typeorm'
import { UserToRoomRepository } from './user-to-room.repository'
import type { UserToRoom } from 'src/user-to-room/user-to-room.entity'

@Injectable()
export class UserToRoomService {
  constructor(
    @InjectRepository(UserToRoomRepository)
    private userToRoomRepository: UserToRoomRepository,
  ) {}

  getUserToRoom(authUserId: number, roomId: number, loadRelationIds = false): Promise<UserToRoom> {
    return this.userToRoomRepository.findOne({
      where: {
        user: { id: authUserId },
        room: { id: roomId },
      },
      loadRelationIds,
    })
  }

  getRoomsOfUser(authUserId: number, archived = false): Promise<UserToRoom[]> {
    return this.userToRoomRepository.find({
      where: {
        user: { id: authUserId },
        archived,
      },
      relations: { room: true },
    })
  }

  get1to1RoomIdOfUsers(userId1: number, userId2: number): Promise<number | null> {
    return this.userToRoomRepository.get1to1RoomIdOfUsers(userId1, userId2)
  }

  async updateFirstMsgTstamp(authUserId: number, roomId: number, newValue: string): Promise<void> {
    await this.userToRoomRepository.updateUserToRoom(authUserId, roomId, {
      firstMsgTstamp: newValue !== null ? new Date(newValue) : null,
    })
  }

  async clearChat(authUserId: number, roomId: number): Promise<void> {
    // TODO: check if chat is already cleared - throw error in that case
    await this.userToRoomRepository.updateUserToRoom(authUserId, roomId, { firstMsgTstamp: new Date() })
  }

  async deleteChat(authUserId: number, roomId: number): Promise<void> {
    // TODO: check if chat is already deleted - throw error in that case
    await this.userToRoomRepository.updateUserToRoom(authUserId, roomId, { firstMsgTstamp: null, deleted: true })
  }

  async updatePin(authUserId: number, roomId: number, newValue: boolean): Promise<void> {
    // TODO: check if chat is already pinned - throw error in that case
    await this.userToRoomRepository.updateUserToRoom(authUserId, roomId, { pinned: newValue })
  }

  async updateArchive(authUserId: number, roomId: number, newValue: boolean): Promise<void> {
    // TODO: check if chat is already archived/unarchived - throw error in that case
    await this.userToRoomRepository.updateUserToRoom(authUserId, roomId, { archived: newValue, pinned: false })
  }

  async reviveRoomForUser(userId: number, roomId: number) {
    await this.userToRoomRepository.updateUserToRoom(userId, roomId, { deleted: false })
  }
}
