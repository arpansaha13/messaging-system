import type { User } from '../user.entity'

export interface AuthUserResponse extends User {
  channels: number[]
}
