import { Injectable } from '@nestjs/common'
import { InjectRepository, InjectEntityManager } from '@nestjs/typeorm'
// Entities
import { UserToRoom } from 'src/UserToRoom/UserToRoom.entity'
// Types
import { EntityManager, Not, Repository, UpdateResult } from 'typeorm'

@Injectable()
export class UserToRoomService {
  constructor(
    @InjectEntityManager()
    private em: EntityManager,

    @InjectRepository(UserToRoom)
    private userToRoomRepository: Repository<UserToRoom>,
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

  /**
   * Finds the room_id of a one-to-one chat-room for the two given user_id's.
   * Returns `null` if no such room exists.
   */
  async get1to1RoomIdOfUsers(userId1: number, userId2: number): Promise<number | null> {
    const query = `
    SELECT u2r.room_id
    FROM (
      SELECT u2r.user_id, u2r.room_id
      FROM user_to_room AS u2r
      WHERE u2r.user_id = ${userId1}
    ) AS u2r
    INNER JOIN user_to_room AS r2u ON u2r.room_id = r2u.room_id AND r2u.user_id = ${userId2}
    `
    const res = await this.em.query(query)
    return res.length > 0 ? res[0].room_id : null
  }
  getReceiverIn1to1Room(authUserId: number, roomId: number, loadRelationIds = false): Promise<UserToRoom> {
    return this.userToRoomRepository.findOne({
      where: {
        user: { id: Not(authUserId) },
        room: { id: roomId },
      },
      loadRelationIds,
    })
  }

  #updateUserToRoom(userId: number, roomId: number, partialEntity: Partial<UserToRoom>): Promise<UpdateResult> {
    return this.userToRoomRepository.update(
      {
        user: { id: userId },
        room: { id: roomId },
      },
      partialEntity,
    )
  }
  async updateFirstMsgTstamp(authUserId: number, roomId: number, newValue: string): Promise<void> {
    await this.#updateUserToRoom(authUserId, roomId, { firstMsgTstamp: newValue !== null ? new Date(newValue) : null })
  }
  async clearChat(authUserId: number, roomId: number): Promise<void> {
    // TODO: check if chat is already cleared - throw error in that case
    await this.updateFirstMsgTstamp(authUserId, roomId, null)
  }
  async deleteChat(authUserId: number, roomId: number): Promise<void> {
    // TODO: check if chat is already deleted - throw error in that case
    await this.#updateUserToRoom(authUserId, roomId, { firstMsgTstamp: null, deleted: true })
  }
  async updatePin(authUserId: number, roomId: number, newValue: boolean): Promise<void> {
    // TODO: check if chat is already pinned - throw error in that case
    await this.#updateUserToRoom(authUserId, roomId, { pinned: newValue })
  }
  async updateArchive(authUserId: number, roomId: number, newValue: boolean): Promise<void> {
    // TODO: check if chat is already archived/unarchived - throw error in that case
    await this.#updateUserToRoom(authUserId, roomId, { archived: newValue, pinned: false })
  }
  async reviveRoomForUser(userId: number, roomId: number) {
    await this.#updateUserToRoom(userId, roomId, { deleted: false })
  }
}
