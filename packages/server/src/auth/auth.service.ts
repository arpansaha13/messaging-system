import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { InjectRepository } from '@nestjs/typeorm'
import * as bcrypt from 'bcrypt'
// Entity
import { AuthEntity } from './auth.entity'
import { UserEntity } from 'src/entities/user.entity'
// DTO
import { SignInDto, SignUpDto } from './auth.dto'
// Types
import type { Repository } from 'typeorm'
import type { JwtPayload, JwtToken } from './jwt.types'

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
    const payload: JwtPayload = { userTag: userEntity.userTag }
    const authToken = this.jwtService.sign(payload)
    return { authToken }
  }

  async signUp(credentials: SignUpDto): Promise<JwtToken> {
    const userEntity = this.userRepository.create({
      username: credentials.username,
      email: credentials.email,
    })

    try {
      await this.userRepository.save(userEntity)
      const hash = await bcrypt.hash(
        credentials.password,
        await bcrypt.genSalt(),
      )
      const authEntity = this.authRepository.create({
        userTag: userEntity.userTag,
        password: hash,
      })
      await this.authRepository.save(authEntity)
      return this.#createAuthToken(userEntity)
    } catch (error) {
      if (error.code === '23505') {
        // Duplicate key
        if ((error.detail as string).includes('username')) {
          throw new ConflictException({
            statusCode: 409,
            message: {
              username: 'Username is already taken.',
            },
            error: 'Conflict',
          })
        } else if ((error.detail as string).includes('email')) {
          throw new ConflictException({
            statusCode: 409,
            message: {
              email: 'Email id is already registered.',
            },
            error: 'Conflict',
          })
        } else {
          throw new InternalServerErrorException()
        }
      } else {
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
        where: { userTag: userEntity.userTag },
      })
      if (await bcrypt.compare(credentials.password, authEntity.password)) {
        return this.#createAuthToken(userEntity)
      }
    }
    throw new UnauthorizedException('Invalid email or password.')
  }
}
