import AppDataSource from '../data-source'
import { Channel } from '../models/channel.entity'
import { In, Repository } from 'typeorm'

export class ChannelRepository extends Repository<Channel> {
  constructor() {
    super(Channel, AppDataSource.createEntityManager())
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
