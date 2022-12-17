import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { TypeOrmModule } from '@nestjs/typeorm'
import { PassportModule } from '@nestjs/passport'
import { ConfigModule, ConfigService } from '@nestjs/config'
// Controller
import { AuthController } from './auth.controller'
// Service
import { AuthService } from './auth.service'
// Entities
import { UserEntity } from 'src/users/user.entity'
import { AuthEntity } from './auth.entity'
import { JwtStrategy } from './jwt.strategy'
// Types
import type { EnvironmentVariables } from 'src/env.types'

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, AuthEntity]),

    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<EnvironmentVariables>) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: Number(configService.get('JWT_TOKEN_VALIDITY_SECONDS')),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, ConfigService],
  // Export so that any module that imports this module is able to use the auth mechanism.
  exports: [JwtStrategy, PassportModule],
})
export class AuthModule {}
