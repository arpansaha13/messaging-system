import { Injectable, UnauthorizedException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
// Entity
import { UserEntity } from '../users/user.entity'
// Types
import { Repository } from 'typeorm'
import { JwtPayload } from './jwt.types'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {
    super({
      secretOrKey: 'dummy-secret-key-13',
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    })
  }
  async validate(payload: JwtPayload): Promise<UserEntity> {
    const { user_id } = payload
    const userEntity = await this.userRepository.findOne({
      where: { id: user_id },
    })
    if (userEntity === null) {
      throw new UnauthorizedException()
    }
    // The user entity will be appended to the request object.
    return userEntity
  }
}
