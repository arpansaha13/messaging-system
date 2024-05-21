import { Injectable } from '@nestjs/common'
import { DataSource, Repository } from 'typeorm'
import { UnverifiedUser } from './unverified-user.entity'

@Injectable()
export class UnverifiedUserRepository extends Repository<UnverifiedUser> {
  constructor(private dataSource: DataSource) {
    super(UnverifiedUser, dataSource.createEntityManager())
  }
}
