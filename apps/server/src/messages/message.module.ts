import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { AuthModule } from 'src/auth/auth.module'
import { MessageEntity } from './message.entity'
import { MessageController } from './message.controller'
import { MessageService } from './message.service'

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([MessageEntity])],
  controllers: [MessageController],
  providers: [MessageService],
  exports: [MessageService],
})
export class MessageModule {}
