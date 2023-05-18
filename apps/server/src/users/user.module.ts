import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { AuthModule } from 'src/auth/auth.module'
import { MessageModule } from 'src/messages/message.module'

import { UserEntity } from './user.entity'
import { UserController } from './user.controller'
import { UserService } from './user.service'

@Module({
  imports: [MessageModule, TypeOrmModule.forFeature([UserEntity]), AuthModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
