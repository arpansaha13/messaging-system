import { Injectable } from '@nestjs/common'
import { Repository, DataSource, In } from 'typeorm'
import { Channel } from './channel.entity'
import type { Group } from 'src/groups/group.entity'

@Injectable()
export class ChannelRepository extends Repository<Channel> {
  constructor(private readonly dataSource: DataSource) {
    super(Channel, dataSource.createEntityManager())
  }

  /** Get only the ids of the channels belonging to the groups. */
  async getChannelIdsByGroupIds(groupIds: Group['id'][]): Promise<Channel['id'][]> {
    const channels = await this.find({
      select: ['id'],
      where: { group: { id: In(groupIds) } },
    })

    return channels.map(channel => channel.id)
  }

  getChannelsByGroupId(groupId: Group['id']) {
    return this.findBy({
      group: { id: groupId },
    })
  }
}
