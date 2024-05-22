import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { UserRepository } from './user.repository'
import type { ConvoItemType } from '@pkg/types'
import type { User } from 'src/users/user.entity'
import type { UpdateUserInfoDto } from './dto/update-user-info.dto'
import type { UserConvoResponse } from './dto/user-convo-response.dto'

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserRepository)
    private userRepository: UserRepository,
  ) {}

  async getUserById(userId: number): Promise<User> {
    const user = await this.userRepository.findOneBy({ id: userId })
    if (user === null) throw new NotFoundException('User could not be found.')
    return user
  }

  async updateUserInfo(userId: number, data: UpdateUserInfoDto): Promise<User> {
    const updateResult = await this.userRepository.update(userId, { ...data })

    if (updateResult.affected) return this.getUserById(userId)
    else throw new NotFoundException()
  }

  async getUserConvo(authUserId: number): Promise<UserConvoResponse> {
    const convoRes = await this.userRepository.getConvo(authUserId)
    return prepareConvo(convoRes)
  }

  async findUsers(authUserId: number, searchUserId: number): Promise<User> {
    if (authUserId === searchUserId) return null
    return this.userRepository.findOneBy({ id: searchUserId })
  }
}

/** Generic type A = archived */
function prepareConvo(convoRes: any[]): UserConvoResponse {
  const archived: ConvoItemType<true>[] = []
  const unarchived: ConvoItemType[] = []

  for (const convoItem of convoRes) {
    const template: ConvoItemType<boolean> = {
      userToRoomId: convoItem.u2r_id,
      room: {
        id: convoItem.r_id,
        archived: convoItem.u2r_archived,
        pinned: convoItem.u2r_pinned,
        muted: convoItem.u2r_muted,
        isGroup: convoItem.r_is_group,
      },
      contact: convoItem.c_id
        ? {
            id: convoItem.c_id,
            alias: convoItem.c_alias,
          }
        : null,
      user: {
        id: convoItem.u_id,
        dp: convoItem.u_dp,
        bio: convoItem.u_bio,
        globalName: convoItem.u_global_name,
      },
      latestMsg: convoItem.msg_content
        ? {
            content: convoItem.msg_content,
            createdAt: convoItem.msg_created_at,
            senderId: convoItem.msg_sender_id,
            status: convoItem.msg_status,
          }
        : null,
    }
    if (template.room.archived) archived.push(template as ConvoItemType<true>)
    else unarchived.push(template as ConvoItemType<false>)
  }
  return { unarchived, archived }
}
