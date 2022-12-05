import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
// Auth Module
import { AuthModule } from 'src/auth/auth.module'
// WebSocket Gateway
// Controller
import { UserController } from './user.controller'
// Services
import { UserService } from './user.service'
// Entity
import { UserEntity } from './user.entity'

/**
 * Module for getting auth user information.
 */
@Module({
  imports: [TypeOrmModule.forFeature([UserEntity]), AuthModule],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
