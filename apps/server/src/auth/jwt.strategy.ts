import { Injectable, UnauthorizedException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { User } from '../users/user.entity'
import { Repository } from 'typeorm'
import { JwtPayload } from './jwt.types'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    super({
      secretOrKey: process.env.JWT_SECRET,
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
