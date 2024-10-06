import { Injectable } from '@nestjs/common'
import { Repository, DataSource } from 'typeorm'
import { Channel } from './channel.entity'
import type { Group } from 'src/groups/group.entity'

@Injectable()
export class ChannelRepository extends Repository<Channel> {
  constructor(private dataSource: DataSource) {
    super(Channel, dataSource.createEntityManager())
  }

  getChannelsByGroupId(groupId: Group['id']) {
    return this.findBy({
      group: { id: groupId },
    })
  }
}
