import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'

// Modules
import { ChatsModule } from './modules/chats.module'
import { ChatListModule } from './modules/chatList.module'
import { ContactsModule } from './modules/contacts.module'

@Module({
  imports: [ChatsModule, ChatListModule, ContactsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
