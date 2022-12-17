import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
// Entities
import { UserEntity } from 'src/users/user.entity'
// Types
import type { Repository } from 'typeorm'
import type { UpdateUserInfoDto } from './dto/update-user-info.dto'

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  async getUserById(userId: number): Promise<UserEntity> {
    const userEntity = await this.userRepository.findOneBy({ id: userId })
    if (userEntity === null) throw new NotFoundException('User could not be found.')
    return userEntity
  }

  async getRoomIdsOfUser(userId: number): Promise<UserEntity> {
    const userEntity = await this.userRepository.findOne({
      select: {
        id: true,
        rooms: {
          userToRoomId: true,
          room: { id: true },
        },
      },
      where: { id: userId },
      relations: {
        rooms: {
          room: true,
        },
      },
    })
    if (userEntity === null) throw new NotFoundException('User could not be found.')
    return userEntity
  }

  async updateUserInfo(userId: number, data: UpdateUserInfoDto): Promise<UserEntity> {
    const updateResult = await this.userRepository.update(userId, { ...data })

    if (updateResult.affected) return this.getUserById(userId)
    else throw new NotFoundException()
  }
}
