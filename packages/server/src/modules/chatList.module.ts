import { Module } from '@nestjs/common'
import { ChatListController } from 'src/controllers/chatList.controller'
import { ChatListService } from 'src/services/chatList.service'

@Module({
  imports: [],
  controllers: [ChatListController],
  providers: [ChatListService],
})
export class ChatListModule {}
