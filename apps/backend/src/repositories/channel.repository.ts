import { type DataSource, In, Repository } from 'typeorm'
import { Channel } from '../models/channel.entity'

export class ChannelRepository extends Repository<Channel> {
  constructor(dataSource: DataSource) {
    super(Channel, dataSource.createEntityManager())
  }

  async getChannelIdsByGroupIds(groupIds: number[]) {
    const channels = await this.find({ select: ['id'], where: { group: { id: In(groupIds) } } as any })
    return channels.map(c => c.id)
  }

  getChannelsByGroupId(groupId: number) {
    return this.findBy({ group: { id: groupId } } as any)
  }

  saveChannel(channel: Partial<Channel>) {
    const e = this.create(channel as any)
    return this.save(e)
  }
}
