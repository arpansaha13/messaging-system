import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'

// Modules
import { UsersModule } from './modules/users.module'
import { ChatsModule } from './modules/chats.module'
import { ChatListModule } from './modules/chatList.module'

@Module({
  imports: [ChatsModule, ChatListModule, UsersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
