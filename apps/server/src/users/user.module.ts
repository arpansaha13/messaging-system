import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { MessageModule } from 'src/messages/message.module'
import { User } from './user.entity'
import { UserService } from './user.service'
import { UserController } from './user.controller'
import { UserRepository } from './user.repository'

@Module({
  imports: [MessageModule, TypeOrmModule.forFeature([User])],
  controllers: [UserController],
  providers: [UserRepository, UserService],
  exports: [UserService],
})
export class UserModule {}
