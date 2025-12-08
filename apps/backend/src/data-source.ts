import 'reflect-metadata'
import { DataSource } from 'typeorm'
import { Channel } from './models/channel.entity'
import { Chat } from './models/chat.entity'
import { Contact } from './models/contact.entity'
import { Group } from './models/group.entity'
import { Invite } from './models/invite.entity'
import { MessageRecipient } from './models/message-recipient.entity'
import { Message } from './models/message.entity'
import { Session } from './models/session.entity'
import { UnverifiedUser } from './models/unverified-user.entity'
import { UserGroup } from './models/user-group.entity'
import { User } from './models/user.entity'
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
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'messaging_db',
  synchronize: process.env.DB_SYNCHRONIZE === 'true',
  logging: process.env.DB_LOGGING === 'true',
  entities,
  migrations,
})

export default AppDataSource
