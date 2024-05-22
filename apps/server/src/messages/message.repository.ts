import { Injectable } from '@nestjs/common'
import { DataSource, MoreThanOrEqual, Repository } from 'typeorm'
import { Message } from './message.entity'
import type { Room } from 'src/rooms/room.entity'
import type { UserToRoom } from 'src/user-to-room/user-to-room.entity'

@Injectable()
export class MessageRepository extends Repository<Message> {
  constructor(private dataSource: DataSource) {
    super(Message, dataSource.createEntityManager())
  }

  getMessagesByRoomId(roomId: Room['id'], firstMsgTstamp: UserToRoom['firstMsgTstamp']) {
    return this.find({
      select: {
        id: true,
        content: true,
        createdAt: true,
        senderId: true,
        // Send status of all messages irrespective of whether it belongs to auth-user or not
        // This is used to show read receipts
        status: true,
      },
      where: { room: { id: roomId }, createdAt: MoreThanOrEqual(firstMsgTstamp) },
      order: { createdAt: 'ASC' },
    })
  }
}
