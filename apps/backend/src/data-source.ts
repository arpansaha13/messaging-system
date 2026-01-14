import 'reflect-metadata'
import { DataSource } from 'typeorm'
import { Channel } from './models/channel'
import { Chat } from './models/chat'
import { Contact } from './models/contact'
import { Group } from './models/group'
import { Invite } from './models/invite'
import { MessageRecipient } from './models/message-recipient'
import { Message } from './models/message'
import { UserGroup } from './models/user-group'
import { UserProfile } from './models/user'
import { Initial1768410457029 } from './migrations/1768410457029-initial'

const entities = [Channel, Chat, Contact, Group, Invite, Message, MessageRecipient, UserGroup, UserProfile]

const migrations = [Initial1768410457029]

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 7020,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'messaging_db',
  synchronize: process.env.DB_SYNCHRONIZE === 'true',
  logging: process.env.DB_LOGGING === 'true',
  entities,
  migrations,
})

export default AppDataSource
