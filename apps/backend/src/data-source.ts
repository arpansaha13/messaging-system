import 'reflect-metadata'
import { DataSource } from 'typeorm'
import { Channel } from './models/channel'
import { Chat } from './models/chat'
import { Contact } from './models/contact'
import { Group } from './models/group'
import { Invite } from './models/invite'
import { MessageRecipient } from './models/message-recipient'
import { Message } from './models/message'
import { Session } from './models/session'
import { UnverifiedUser } from './models/unverified-user'
import { UserGroup } from './models/user-group'
import { User } from './models/user'
import { Initial1765028940520 } from './migrations/1765028940520-initial'

const entities = [
  Channel,
  Chat,
  Contact,
  Group,
  Invite,
  Message,
  MessageRecipient,
  Session,
  UnverifiedUser,
  UserGroup,
  User,
]

const migrations = [Initial1765028940520]

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 7000,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'messaging_db',
  synchronize: process.env.DB_SYNCHRONIZE === 'true',
  logging: process.env.DB_LOGGING === 'true',
  entities,
  migrations,
})

export default AppDataSource
