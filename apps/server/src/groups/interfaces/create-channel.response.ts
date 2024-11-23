import type { Group } from 'src/groups/group.entity'
import type { Channel } from 'src/channels/channel.entity'

export interface CreateChannelResponse {
  groupId: Group['id']
  channelId: Channel['id']
}
