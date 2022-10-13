import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

// Auth Module
import { AuthModule } from 'src/auth/auth.module'
// Controller
import { AuthUserController } from 'src/controllers/me.controller'
// Entity
import { UserEntity } from 'src/entities/user.entity'

/**
 * Module for getting auth user information.
 */
@Module({
  imports: [TypeOrmModule.forFeature([UserEntity]), AuthModule],
  controllers: [AuthUserController],
})
export class AuthUserModule {}
