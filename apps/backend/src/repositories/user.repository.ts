import { type DataSource, Repository } from 'typeorm'
import { User } from '../models/user.entity'

export class UserRepository extends Repository<User> {
  constructor(dataSource: DataSource) {
    super(User, dataSource.createEntityManager())
  }

  findAll() {
    return this.find()
  }

  findById(id: number) {
    return this.findOne({ where: { id } })
  }

  findByEmail(email: string) {
    return this.findOne({ where: { email } })
  }

  createUser(data: Partial<User>) {
    const entity = this.create(data)
    return this.save(entity)
  }

  async updateUser(id: number, data: Partial<User>) {
    await this.update(id, data)
    return this.findById(id)
  }

  deleteUser(id: number) {
    return this.delete(id)
  }

  async findByQuery(authUserId: number, query: string): Promise<User[]> {
    return this.createQueryBuilder('user')
      .where('user.id != :authUserId', { authUserId })
      .andWhere('(user.globalName ILIKE :query OR user.username ILIKE :query)', { query: `%${query}%` })
      .select(['user.id', 'user.globalName', 'user.username', 'user.bio', 'user.dp'])
      .limit(20)
      .getMany()
  }
}
