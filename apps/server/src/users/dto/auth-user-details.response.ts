import type { User } from '../user.entity'

export interface AuthUserResponse extends Omit<User, 'password'> {
  channels: number[]
}
