import type { Group } from 'src/groups/group.entity'
import type { Channel } from 'src/channels/channel.entity'

export interface CreateGroupResponse {
  id: Group['id']
  channels: Channel['id'][]
}
