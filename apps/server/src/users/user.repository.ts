import { Injectable } from '@nestjs/common'
import { Repository, DataSource, Brackets } from 'typeorm'
import { User } from './user.entity'

@Injectable()
export class UserRepository extends Repository<User> {
  constructor(private dataSource: DataSource) {
    super(User, dataSource.createEntityManager())
  }

  async getUsersByQuery(userId: User['id'], search: string) {
    return (
      this.createQueryBuilder('user')
        .select(['user.id', 'user.globalName', 'user.username', 'user.bio', 'user.dp'])
        .where('user.id != :userId', { userId })
        // .andWhere(
        //   new Brackets(qb => {
        //     // prettier-ignore
        //     qb.where('contact.user.id = :userId', {userId})
        //       .orWhere('contact.user.id = NULL')
        //   }),
        // )
        .andWhere(
          new Brackets(qb => {
            // Search the beginning of each word
            // TODO: Find an efficient way to search
            const params = {
              firstWord: `${search}%`,
              remainingWords: `% ${search}%`,
            }
            // prettier-ignore
            qb.where('user.globalName ILIKE :firstWord OR user.globalName ILIKE :remainingWords', params)
            .orWhere('user.username ILIKE :firstWord OR user.username ILIKE :remainingWords', params)
          }),
        )
        .getMany()
    )
  }
}
