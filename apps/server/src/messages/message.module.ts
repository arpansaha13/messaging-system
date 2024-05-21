import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Message } from './message.entity'
import { MessageService } from './message.service'
import { MessageRepository } from './message.repository'
import { MessageController } from './message.controller'

@Module({
  imports: [TypeOrmModule.forFeature([Message])],
  controllers: [MessageController],
  providers: [MessageRepository, MessageService],
  exports: [MessageService],
})
export class MessageModule {}
