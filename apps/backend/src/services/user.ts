import { UserRepository } from '../repositories/user'
import { ContactRepository } from '../repositories/contact'
import { ChannelRepository } from '../repositories/channel'
import { UserGroupRepository } from '../repositories/user-group'
import { UserProfile } from '../models/user'
import { AuthService } from './auth'
import type { Request } from 'express'

interface AuthUserResponse {
  id: number
  globalName: string
  bio: string
  email: string
  username: string
}

export class UserService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly contactRepo: ContactRepository,
    private readonly userGroupRepo: UserGroupRepository,
    private readonly channelRepo: ChannelRepository,
  ) {}

  async getAuthUser(context: Request['context']): Promise<AuthUserResponse | null> {
    const userResponse = await AuthService.getUser(context.user.id, context.token)
    const user = userResponse.user

    const profile = await this.userRepo.findByUserId(user.user_id)

    return {
      id: user.user_id,
      email: user.email,
      username: user.username,
      globalName: profile.globalName,
      bio: profile.bio,
    }
  }

  async createUser(data: Partial<UserProfile>): Promise<UserProfile | null> {
    return this.userRepo.createUser(data)
  }

  async updateUser(context: Request['context'], id: number, data: Partial<UserProfile>) {
    return this.userRepo.updateUser(id, data)
  }

  async deleteUser(id: number) {
    return this.userRepo.deleteUser(id)
  }

  async findUsers(context: Request['context'], authUserId: number, query: string) {
    return this.userRepo.findByQuery(authUserId, query)
  }

  async getUserWithContactById(context: Request['context'], authUserId: number, userId: number) {
    const user = await this.userRepo.findById(userId)
    if (!user) throw new Error('User could not be found.')

    const contact = await this.contactRepo.findOne({
      where: {
        user: { id: authUserId },
        userInContact: { id: userId },
      },
    })

    return {
      ...user,
      contact: contact ? { id: contact.id, alias: contact.alias } : null,
    }
  }
}
