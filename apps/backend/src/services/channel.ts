import { ChannelRepository } from '../repositories/channel'

export class ChannelService {
  constructor(private readonly repo: ChannelRepository) {}

  getChannelsOfGroup(groupId: number) {
    return this.repo.getChannelsByGroupId(groupId)
  }

  getChannel(channelId: number) {
    return this.repo.findOne({ where: { id: channelId } })
  }

  async createChannel(groupId: number, createChannelDto: any) {
    const channel = await this.repo.save(
      this.repo.create({
        name: createChannelDto.name,
        group: { id: groupId },
      }),
    )
    return { groupId: groupId, channelId: channel.id }
  }
}
