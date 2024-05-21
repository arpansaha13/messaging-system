import { Global, Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { TypeOrmModule } from '@nestjs/typeorm'
import { PassportModule } from '@nestjs/passport'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { UnverifiedUser } from './unverified-user.entity'
import { UnverifiedUserRepository } from './unverified-user.repository'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { MailModule } from 'src/mail/mail.module'
import { User } from 'src/users/user.entity'
import { UserRepository } from 'src/users/user.repository'
import { SessionModule } from 'src/sessions/session.module'
import { CookieStrategy } from './cookie.strategy'
import type { JwtEnvVariables } from '../env.types'

@Global()
@Module({
  imports: [
    MailModule,
    ConfigModule,
    SessionModule,

    TypeOrmModule.forFeature([User, UnverifiedUser]),
    PassportModule.register({ defaultStrategy: 'cookie' }),

    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<JwtEnvVariables>) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: Number(configService.get('JWT_TOKEN_VALIDITY_SECONDS')),
        },
        verifyOptions: {
          maxAge: Number(configService.get('JWT_TOKEN_VALIDITY_SECONDS')),
        },
      }),
    }),
  ],

  controllers: [AuthController],
  providers: [AuthService, CookieStrategy, ConfigService, UserRepository, UnverifiedUserRepository],

  // Export so that any module that imports this module is able to use the auth mechanism.
  exports: [CookieStrategy, PassportModule],
})
export class AuthModule {}
