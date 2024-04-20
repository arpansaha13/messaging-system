import { ConfigService } from '@nestjs/config'
import { InjectRepository } from '@nestjs/typeorm'
import { PassportStrategy } from '@nestjs/passport'
import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { User } from 'src/users/user.entity'
import { Repository } from 'typeorm'
import { JwtPayload } from './jwt.types'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    super({
      secretOrKey: configService.get('JWT_SECRET'),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    })
  }
  async validate(payload: JwtPayload): Promise<User> {
    const { user_id } = payload
    const user = await this.userRepository.findOne({
      where: { id: user_id },
    })
    if (user === null) {
      throw new UnauthorizedException()
    }
    // The user entity will be appended to the request object.
    return user
  }
}
