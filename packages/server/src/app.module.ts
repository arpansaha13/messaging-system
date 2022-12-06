import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { RoomModule } from './rooms/room.module'
import { UserModule } from './users/user.module'
import { ChatsModule } from './chats/chats.module'
import { MessageModule } from './messages/message.module'
import { ContactModule } from './contacts/contact.module'
import { UserToRoomModule } from './UserToRoom/userToRoom.module'

import { DATABASE_HOST_PORT } from './constants'

@Module({
  imports: [
    UserModule,
    RoomModule,
    ChatsModule,
    MessageModule,
    ContactModule,
    UserToRoomModule,

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
