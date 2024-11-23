import type { User } from 'src/users/user.entity'
import type { Group } from 'src/groups/group.entity'
import type { Channel } from 'src/channels/channel.entity'

export interface AuthUserResponse extends Omit<User, 'password'> {
  groups: Group['id'][]
  channels: Channel['id'][]
}
