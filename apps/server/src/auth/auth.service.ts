import { ConflictException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { InjectRepository, InjectEntityManager } from '@nestjs/typeorm'
import * as bcrypt from 'bcryptjs'
import { UserEntity } from 'src/users/user.entity'
import { SignInDto, SignUpDto } from './auth.dto'
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
  ) {}

  async #createAuthToken(user: UserEntity): Promise<JwtToken> {
    const payload: JwtPayload = { user_id: user.id }
    const authToken = this.jwtService.sign(payload)
    const expiresAt = Date.now() /* milli-secs */ + this.configService.get('JWT_TOKEN_VALIDITY_SECONDS') * 1000
    return { authToken, expiresAt }
  }

  async signUp(credentials: SignUpDto): Promise<JwtToken> {
    if (credentials.password !== credentials.confirmPassword) {
      throw new UnauthorizedException('Password and confirm password do not match.')
    }

    try {
      const newUser = await this.entityManager.transaction(async txnEntityManager => {
        const hash = await bcrypt.hash(credentials.password, await bcrypt.genSalt())

        const user = txnEntityManager.create(UserEntity, {
          email: credentials.email,
          displayName: credentials.displayName,
          password: hash,
        })
        await txnEntityManager.save(user)
        return user
      })

      return this.#createAuthToken(newUser)
    } catch (error) {
      if (error.code === '23505') {
        // Duplicate key
        throw new ConflictException('Email id is already registered.')
      }

      console.log(error)
      throw new InternalServerErrorException()
    }
  }

  async login(credentials: SignInDto): Promise<JwtToken> {
    const user = await this.userRepository.findOne({
      where: { email: credentials.email },
    })
    if (user !== null && (await bcrypt.compare(credentials.password, user.password))) {
      return this.#createAuthToken(user)
    }
    throw new UnauthorizedException('Invalid email or password.')
  }
}
