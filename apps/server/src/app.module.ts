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
import type { EnvVariables } from 'src/env.types'

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
      cache: true,
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<EnvVariables>) => ({
        type: 'postgres',
        host: configService.get('TYPEORM_HOST'),
        port: configService.get('TYPEORM_PORT'),
        username: configService.get('TYPEORM_USERNAME'),
        password: configService.get('TYPEORM_PASSWORD'),
        database: configService.get('TYPEORM_DATABASE'),
        url: configService.get('TYPEORM_DATABASE_URL'),
        autoLoadEntities: configService.get('NODE_ENV') === 'development',
        synchronize: configService.get('NODE_ENV') === 'development', // Do not use in production
      }),
    }),
  ],
  controllers: [AppController],
})
export class AppModule {}
