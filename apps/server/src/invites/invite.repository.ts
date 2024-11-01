import { Injectable } from '@nestjs/common'
import { Repository, DataSource } from 'typeorm'
import { Invite } from './invite.entity'

@Injectable()
export class InviteRepository extends Repository<Invite> {
  constructor(private dataSource: DataSource) {
    super(Invite, dataSource.createEntityManager())
  }
}
