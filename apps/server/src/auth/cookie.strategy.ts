import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { InjectRepository } from '@nestjs/typeorm'
import { PassportStrategy } from '@nestjs/passport'
import { Injectable, UnauthorizedException } from '@nestjs/common'
import { Strategy } from 'passport-cookie'
import { UserRepository } from 'src/users/user.repository'
import { SessionService } from 'src/sessions/session.service'
import type { User } from 'src/users/user.entity'
import type { EnvVariables } from 'src/env.types'

@Injectable()
export class CookieStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService<EnvVariables>,
    private readonly jwtService: JwtService,
    private readonly sessionService: SessionService,

    @InjectRepository(UserRepository)
    private readonly userRepository: UserRepository,
  ) {
    super({
      cookieName: configService.get('AUTH_COOKIE_NAME'),
    })
  }

  async validate(sessionKey: string): Promise<User> {
    try {
      const session = await this.sessionService.getSessionById(sessionKey)

      if (session === null) throw new UnauthorizedException()

      const payload = this.jwtService.verify(session.token)
      const { user_id } = payload

      const user = await this.userRepository.findOne({
        where: { id: user_id },
      })

      if (user === null) throw new UnauthorizedException()

      // The user entity will be appended to the request object.
      return user
    } catch (err) {
      // Invalid token
      throw new UnauthorizedException()
    }
  }
}
