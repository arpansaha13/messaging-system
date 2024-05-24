import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { UserRepository } from './user.repository'
import type { User } from 'src/users/user.entity'
import type { UpdateUserInfoDto } from './dto/update-user-info.dto'

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

  async findUsers(authUserId: number, searchUserId: number): Promise<User> {
    if (authUserId === searchUserId) return null
    return this.userRepository.findOneBy({ id: searchUserId })
  }
}
