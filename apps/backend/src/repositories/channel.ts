import { type DataSource, In, Repository } from 'typeorm'
import { Channel } from '../models/channel'

export class ChannelRepository extends Repository<Channel> {
  constructor(dataSource: DataSource) {
    super(Channel, dataSource.createEntityManager())
  }

  async getChannelIdsByGroupIds(groupIds: number[]) {
    const channels = await this.find({ select: ['id'], where: { group: { id: In(groupIds) } } })
    return channels.map(c => c.id)
  }

  getChannelsByGroupId(groupId: number) {
    return this.findBy({ group: { id: groupId } })
  }

  saveChannel(channel: Partial<Channel>) {
    const e = this.create(channel)
    return this.save(e)
  }
}
