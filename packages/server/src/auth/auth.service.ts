import { ConflictException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { InjectRepository } from '@nestjs/typeorm'
import * as bcrypt from 'bcrypt'
// Entity
import { AuthEntity } from './auth.entity'
import { UserEntity } from 'src/users/user.entity'
// DTO
import { SignInDto, SignUpDto } from './auth.dto'
// Types
import type { Repository } from 'typeorm'
import type { JwtPayload, JwtToken } from './jwt.types'
// Constants
import { JWT_TOKEN_VALIDITY_DURATION } from '../constants'

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,

    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,

    @InjectRepository(AuthEntity)
    private authRepository: Repository<AuthEntity>,
  ) {}

  async #createAuthToken(userEntity: UserEntity): Promise<JwtToken> {
    const payload: JwtPayload = { user_id: userEntity.id }
    const authToken = this.jwtService.sign(payload)
    const expiresAt = Date.now() /* milli-secs */ + JWT_TOKEN_VALIDITY_DURATION * 100 /* secs */
    return { authToken, expiresAt }
  }

  async signUp(credentials: SignUpDto): Promise<JwtToken> {
    const userEntity = this.userRepository.create({
      email: credentials.email,
    })

    try {
      await this.userRepository.save(userEntity)

      // Save encrypted password
      const hash = await bcrypt.hash(credentials.password, await bcrypt.genSalt())
      const authEntity = this.authRepository.create({
        user_id: userEntity.id,
        password: hash,
      })
      await this.authRepository.save(authEntity)
      return this.#createAuthToken(userEntity)
    } catch (error) {
      if (error.code === '23505') {
        // Duplicate key
        throw new ConflictException('Email id is already registered.')
      } else {
        console.log(error)
        throw new InternalServerErrorException()
      }
    }
  }

  async signIn(credentials: SignInDto): Promise<JwtToken> {
    const userEntity = await this.userRepository.findOne({
      where: { email: credentials.email },
    })
    if (userEntity !== null) {
      const authEntity = await this.authRepository.findOne({
        where: { user_id: userEntity.id },
      })
      if (await bcrypt.compare(credentials.password, authEntity.password)) {
        return this.#createAuthToken(userEntity)
      }
    }
    throw new UnauthorizedException('Invalid email or password.')
  }
}
