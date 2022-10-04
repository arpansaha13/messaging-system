import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
// Modules
import { ChatModule } from './modules/chat.module'
import { ContactModule } from './modules/contact.module'
import { ChatListModule } from './modules/chatList.module'

@Module({
  imports: [
    // AuthModule,
    ChatModule,
    ContactModule,
    ChatListModule,

    // DB Connection
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
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
