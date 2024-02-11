import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigModule, ConfigService } from '@nestjs/config'

import { MailModule } from './mail/mail.module'
import { RoomModule } from './rooms/room.module'
import { UserModule } from './users/user.module'
import { ChatsModule } from './chats/chats.module'
import { MessageModule } from './messages/message.module'
import { ContactModule } from './contacts/contact.module'
import { UserToRoomModule } from './UserToRoom/userToRoom.module'
import { AppController } from './app.controller'
import type { TypeormEnvVariables } from 'src/env.types'

// TODO: add pagination in api results

@Module({
  imports: [
    MailModule,
    UserModule,
    RoomModule,
    ChatsModule,
    MessageModule,
    ContactModule,
    UserToRoomModule,

    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<TypeormEnvVariables>) => ({
        type: 'postgres',
        host: configService.get('TYPEORM_HOST'),
        port: configService.get('TYPEORM_PORT'),
        username: configService.get('TYPEORM_USERNAME'),
        password: configService.get('TYPEORM_PASSWORD'),
        database: configService.get('TYPEORM_DATABASE'),
        url: configService.get('TYPEORM_DATABASE_URL'),
        autoLoadEntities: process.env.NODE_ENV === 'development',
        synchronize: process.env.NODE_ENV === 'development', // Do not use in production
      }),
    }),
  ],
  controllers: [AppController],
})
export class AppModule {}
