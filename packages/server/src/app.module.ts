import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigModule, ConfigService } from '@nestjs/config'

import { RoomModule } from './rooms/room.module'
import { UserModule } from './users/user.module'
import { ChatsModule } from './chats/chats.module'
import { MessageModule } from './messages/message.module'
import { ContactModule } from './contacts/contact.module'
import { UserToRoomModule } from './UserToRoom/userToRoom.module'

import type { EnvironmentVariables } from 'src/env.types'

@Module({
  imports: [
    UserModule,
    RoomModule,
    ChatsModule,
    MessageModule,
    ContactModule,
    UserToRoomModule,

    ConfigModule.forRoot(),

    // DB Connection
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<EnvironmentVariables>) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USER'),
        password: configService.get('DB_PWD'),
        database: configService.get('DB_NAME'),
        autoLoadEntities: true,
        synchronize: true, // TODO: remove in production
      }),
    }),
  ],
})
export class AppModule {}
