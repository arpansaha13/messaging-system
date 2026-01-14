import { type DataSource, Repository } from 'typeorm'
import { UserProfile } from '../models/user'
import { AuthService } from '../services/auth'

export class UserRepository extends Repository<UserProfile> {
  constructor(dataSource: DataSource) {
    super(UserProfile, dataSource.createEntityManager())
  }

  async findById(id: number) {
    return this.findOne({
      select: ['id', 'bio', 'dp', 'globalName'],
      where: { id },
    })
  }

  async findByUserId(userId: number) {
    return this.findOne({
      select: ['id', 'bio', 'dp', 'globalName'],
      where: { id: userId },
    })
  }

  /**
   * Find user by email - calls gRPC to auth-system
   */
  async findByEmail(email: string, token: string) {
    try {
      const authUserResponse = await AuthService.getUserByEmail(email, token)
      const userData = authUserResponse.user

      if (!userData) {
        return null
      }

      // Get user profile from local database
      const profile = await this.findByUserId(userData.user_id)

      return {
        id: profile?.id || userData.user_id,
        userId: userData.user_id,
        email: userData.email,
        username: userData.username,
        globalName: profile?.globalName || userData.username,
        dp: profile?.dp || null,
        bio: profile?.bio || '',
      }
    } catch (error: any) {
      console.error('Error finding user by email:', error)
      return null
    }
  }

  async createUser(data: Partial<UserProfile>) {
    const entity = this.create(data)
    return this.save(entity)
  }

  async updateUser(id: number, data: Partial<UserProfile>) {
    await this.update(id, data)
    return this.findById(id)
  }

  async deleteUser(id: number) {
    return this.delete(id)
  }

  async findByQuery(authUserId: number, query: string): Promise<UserProfile[]> {
    return this.createQueryBuilder('user')
      .where('user.id != :authUserId', { authUserId })
      .andWhere('(user.globalName ILIKE :query OR user.userId::text ILIKE :query)', { query: `%${query}%` })
      .select(['user.id', 'user.globalName', 'user.userId', 'user.bio', 'user.dp'])
      .limit(20)
      .getMany()
  }
}
