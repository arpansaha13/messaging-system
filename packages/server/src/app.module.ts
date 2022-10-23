import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
// Modules
import { ChatModule } from './chats/chat.module'
import { AuthUserModule } from './me/me.module'
import { ContactModule } from './contacts/contact.module'
import { ChatListModule } from './chat-list/chatList.module'
// Constants
import { DATABASE_HOST_PORT } from './constants'

@Module({
  imports: [
    ChatModule,
    ContactModule,
    ChatListModule,
    AuthUserModule,

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
  controllers: [],
  providers: [],
})
export class AppModule {}
