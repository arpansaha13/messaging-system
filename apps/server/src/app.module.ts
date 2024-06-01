import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { MailModule } from './mail/mail.module'
import { UserModule } from './users/user.module'
import { AuthModule } from 'src/auth/auth.module'
import { ChatsModule } from './chats/chats.module'
import { MessageModule } from './messages/message.module'
import { ContactModule } from './contacts/contact.module'
import { AppController } from './app.controller'
import type { EnvVariables } from 'src/env.types'

@Module({
  imports: [
    AuthModule,
    MailModule,
    UserModule,
    ChatsModule,
    MessageModule,
    ContactModule,

    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<EnvVariables>) => ({
        entities: ['dist/**/*.entity.js'],
        type: 'postgres',
        host: configService.get('TYPEORM_HOST'),
        port: configService.get('TYPEORM_PORT'),
        username: configService.get('TYPEORM_USERNAME'),
        password: configService.get('TYPEORM_PASSWORD'),
        database: configService.get('TYPEORM_DATABASE'),
        url: configService.get('TYPEORM_DATABASE_URL'),
        ssl: configService.get('NODE_ENV') === 'development' ? false : { rejectUnauthorized: false },
      }),
    }),
  ],
  controllers: [AppController],
})
export class AppModule {}
