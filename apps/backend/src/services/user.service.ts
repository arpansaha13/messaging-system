import { UserRepository } from '../repositories/user.repository'
import { ContactRepository } from '../repositories/contact.repository'
import { User } from '../models/user.entity'

export class UserService {
  constructor(
    private readonly repo: UserRepository,
    private readonly contactRepo: ContactRepository,
  ) {}

  listUsers(): Promise<User[]> {
    return this.repo.findAll()
  }

  getUser(id: number): Promise<User | null> {
    return this.repo.findById(id)
  }

  createUser(data: Partial<User>): Promise<User> {
    return this.repo.createUser(data)
  }

  updateUser(id: number, data: Partial<User>) {
    return this.repo.updateUser(id, data)
  }

  deleteUser(id: number) {
    return this.repo.deleteUser(id)
  }

  findUsers(authUserId: number, query: string) {
    return this.repo.findByQuery(authUserId, query)
  }

  async getUserWithContactById(authUserId: number, userId: number) {
    const user = await this.repo.findById(userId)
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
