import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

// Controller
import { AppController } from './app.controller'
// Service
import { AppService } from './app.service'
// Modules
import { ChatModule } from './modules/chat.module'
import { ChatListModule } from './modules/chatList.module'
import { ContactModule } from './modules/contact.module'

@Module({
  imports: [
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
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
