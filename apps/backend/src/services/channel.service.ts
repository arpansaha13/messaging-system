import { ChannelRepository } from '../repositories/channel.repository'

export class ChannelService {
  constructor(private repo: ChannelRepository) {}

  getChannelsOfGroup(groupId: number) {
    return this.repo.getChannelsByGroupId(groupId)
  }

  getChannel(channelId: number) {
    return this.repo.findOne({ where: { id: channelId } } as any)
  }

  async createChannel(groupId: number, createChannelDto: any) {
    const channel = await this.repo.saveChannel({ name: createChannelDto.name, group: { id: groupId } as any })
    return { groupId: groupId, channelId: channel[0].id }
  }
}
