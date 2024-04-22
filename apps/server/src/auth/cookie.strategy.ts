import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { InjectRepository } from '@nestjs/typeorm'
import { PassportStrategy } from '@nestjs/passport'
import { Injectable, UnauthorizedException } from '@nestjs/common'
import { Strategy } from 'passport-cookie'
import { User } from 'src/users/user.entity'
import type { Repository } from 'typeorm'
import type { EnvVariables } from 'src/env.types'

@Injectable()
export class CookieStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService<EnvVariables>,
    private readonly jwtService: JwtService,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    super({
      cookieName: configService.get('AUTH_COOKIE_NAME'),
    })
  }

  async validate(token: string): Promise<User> {
    try {
      const payload = this.jwtService.verify(token)
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
