import { Module } from '@nestjs/common'
import { ChatsController } from 'src/controllers/chats.controller'
import { ChatsService } from 'src/services/chats.service'

@Module({
  imports: [],
  controllers: [ChatsController],
  providers: [ChatsService],
})
export class ChatsModule {}
