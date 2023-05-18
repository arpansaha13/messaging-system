import { ConflictException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { InjectRepository, InjectEntityManager } from '@nestjs/typeorm'
import * as bcrypt from 'bcryptjs'
// Entity
import { AuthEntity } from './auth.entity'
import { UserEntity } from 'src/users/user.entity'
// DTO
import { SignInDto, SignUpDto } from './auth.dto'
// Types
import type { Repository, EntityManager } from 'typeorm'
import type { JwtPayload, JwtToken } from './jwt.types'

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,

    @InjectEntityManager()
    private entityManager: EntityManager,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(AuthEntity)
    private authRepository: Repository<AuthEntity>,
  ) {}

  async #createAuthToken(userEntity: UserEntity): Promise<JwtToken> {
    const payload: JwtPayload = { user_id: userEntity.id }
    const authToken = this.jwtService.sign(payload)
    const expiresAt = Date.now() /* milli-secs */ + this.configService.get('JWT_TOKEN_VALIDITY_SECONDS') * 1000
    return { authToken, expiresAt }
  }

  async signUp(credentials: SignUpDto): Promise<JwtToken> {
    if (credentials.password !== credentials.confirmPassword) {
      throw new UnauthorizedException('Password and confirm password do not match.')
    }

    try {
      const newUser = await this.entityManager.transaction(async transactionalEntityManager => {
        const userEntity = transactionalEntityManager.create(UserEntity, {
          email: credentials.email,
          displayName: credentials.displayName,
        })
        await transactionalEntityManager.save(userEntity)

        // Save encrypted password
        const hash = await bcrypt.hash(credentials.password, await bcrypt.genSalt())
        const authEntity = transactionalEntityManager.create(AuthEntity, {
          userId: userEntity.id,
          password: hash,
        })

        await transactionalEntityManager.save(authEntity)
        return userEntity
      })

      return this.#createAuthToken(newUser)
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
        where: { userId: userEntity.id },
      })
      if (await bcrypt.compare(credentials.password, authEntity.password)) {
        return this.#createAuthToken(userEntity)
      }
    }
    throw new UnauthorizedException('Invalid email or password.')
  }
}
