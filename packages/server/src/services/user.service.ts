import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
// Entities
import { UserEntity } from 'src/entities/user.entity'
// Types
import type { Repository } from 'typeorm'

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  /** Get the info of a particular user. */
  async getUser(userTag: string): Promise<UserEntity> {
    const userEntity = await this.userRepository.findOne({
      where: { userTag },
    })
    if (userEntity === null) {
      throw new NotFoundException(
        'No user could be found with the given user tag.',
      )
    }
    return userEntity
  }
}
