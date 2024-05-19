import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { MessageModule } from 'src/messages/message.module'
import { User } from './user.entity'
import { UserController } from './user.controller'
import { UserService } from './user.service'

@Module({
  imports: [MessageModule, TypeOrmModule.forFeature([User])],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
