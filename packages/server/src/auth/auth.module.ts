import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { TypeOrmModule } from '@nestjs/typeorm'
import { PassportModule } from '@nestjs/passport'
// Controller
import { AuthController } from './auth.controller'
// Service
import { AuthService } from './auth.service'
// Entities
import { UserEntity } from 'src/entities/user.entity'
import { AuthEntity } from './auth.entity'
import { JwtStrategy } from './jwt.strategy'
// Constants
import { JWT_TOKEN_VALIDITY_DURATION } from '../constants'

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, AuthEntity]),

    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: 'dummy-secret-key-13',
      signOptions: {
        expiresIn: JWT_TOKEN_VALIDITY_DURATION,
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  // Export so that any module that imports this module is able to use the auth mechanism.
  exports: [JwtStrategy, PassportModule],
})
export class AuthModule {}
