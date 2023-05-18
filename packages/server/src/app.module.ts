import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigModule, ConfigService } from '@nestjs/config'

import { RoomModule } from './rooms/room.module'
import { UserModule } from './users/user.module'
import { ChatsModule } from './chats/chats.module'
import { MessageModule } from './messages/message.module'
import { ContactModule } from './contacts/contact.module'
import { UserToRoomModule } from './UserToRoom/userToRoom.module'

import { dbConfigDev, dbConfigProd } from './typeorm.config'

// TODO: add pagination in api results

const envFilePath = process.env.NODE_ENV === 'development' ? `${process.cwd()}/env/dev.env` : `../env/prod.env`

@Module({
  imports: [
    UserModule,
    RoomModule,
    ChatsModule,
    MessageModule,
    ContactModule,
    UserToRoomModule,

    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath,
    }),

    // DB Connection
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: process.env.NODE_ENV === 'development' ? dbConfigDev : dbConfigProd,
    }),
  ],
})
export class AppModule {}
