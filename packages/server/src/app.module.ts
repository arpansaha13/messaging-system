import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
// Modules
import { RoomModule } from './rooms/room.module'
import { UserModule } from './users/user.module'
import { ChatsModule } from './chats/chats.module'
import { MessageModule } from './messages/message.module'
import { ContactModule } from './contacts/contact.module'
// Constants
import { DATABASE_HOST_PORT } from './constants'

// TODO: check all *.module.ts files for unnecessary imports or providers

@Module({
  imports: [
    UserModule,
    RoomModule,
    ChatsModule,
    MessageModule,
    ContactModule,

    // DB Connection
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: DATABASE_HOST_PORT,
      username: 'postgres',
      password: 'postgres',
      database: 'db-whatsapp-clone',
      autoLoadEntities: true,
      synchronize: true,
    }),
  ],
})
export class AppModule {}
