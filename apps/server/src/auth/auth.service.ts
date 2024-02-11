import { ConflictException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { InjectRepository, InjectEntityManager } from '@nestjs/typeorm'
import * as bcrypt from 'bcryptjs'
import { InvalidOrExpiredException } from 'src/common/exceptions'
import { User } from 'src/users/user.entity'
import { UnverifiedUser } from './auth.entity'
import { SignInDto, SignUpDto } from './auth.dto'
import { MailService } from 'src/mail/mail.service'
import type { Repository, EntityManager } from 'typeorm'
import type { JwtPayload, JwtToken } from './jwt.types'

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private mailService: MailService,

    @InjectEntityManager()
    private entityManager: EntityManager,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UnverifiedUser)
    private unverifiedUserRepository: Repository<UnverifiedUser>,
  ) {}

  #PASSWORD_MISMATCH_EXCEPTION_MESSAGE = 'Password and confirm-password do not match.'

  async #createAuthToken(user: User): Promise<JwtToken> {
    const payload: JwtPayload = { user_id: user.id }
    const authToken = this.jwtService.sign(payload)
    const expiresAt = Date.now() /* milli-secs */ + this.config.get('JWT_TOKEN_VALIDITY_SECONDS') * 1000
    return { authToken, expiresAt }
  }

  #generateHash(length = 8) {
    let result = ''
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    const charactersLength = characters.length
    let counter = 0
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength))
      counter++
    }
    return result
  }

  #generateOtp(length = 4) {
    let result = ''
    const characters = '0123456789'
    const charactersLength = characters.length
    let counter = 0
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength))
      counter++
    }
    return result
  }

  async signUp(credentials: SignUpDto): Promise<string> {
    if (credentials.password !== credentials.confirmPassword) {
      throw new UnauthorizedException(this.#PASSWORD_MISMATCH_EXCEPTION_MESSAGE)
    }

    const hash = this.#generateHash()
    const otp = this.#generateOtp()
    let unverifiedUser: UnverifiedUser = null!

    try {
      await this.entityManager.transaction(async txnEntityManager => {
        const hashedPwd = await bcrypt.hash(credentials.password, await bcrypt.genSalt())

        unverifiedUser = txnEntityManager.create(UnverifiedUser, {
          hash,
          otp,
          email: credentials.email,
          displayName: credentials.displayName,
          password: hashedPwd,
        })
        await txnEntityManager.save(unverifiedUser)
      })

      await this.mailService.sendVerificationMail(unverifiedUser, hash, otp)
      return 'Please verify your account using the link sent to your email.'
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

  async validateVerificationLink(hash: string) {
    const isValid = await this.unverifiedUserRepository.exists({ where: { hash } })
    return { valid: isValid }
  }

  async verifyAccount(hash: string, otp: string): Promise<string> {
    try {
      await this.entityManager.transaction(async txnEntityManager => {
        const unverifiedUser = await txnEntityManager.findOne(UnverifiedUser, {
          where: { hash },
        })

        if (unverifiedUser === null) {
          throw new InvalidOrExpiredException('Invalid link.')
        }

        verifyOtpAge.call(this, unverifiedUser)

        const newUser = txnEntityManager.create(User, {
          email: unverifiedUser.email,
          displayName: unverifiedUser.displayName,
          password: unverifiedUser.password,
        })

        await txnEntityManager.save(newUser)
        await txnEntityManager.delete(UnverifiedUser, { hash })
      })

      return 'Account verification successful.'
    } catch (error) {
      if (error.status < 600) {
        throw error
      }
      console.log(error)
      throw new InternalServerErrorException()
    }

    function verifyOtpAge(unverifiedUser: UnverifiedUser) {
      const timeNow = new Date()
      const otpAge = timeNow.getTime() - unverifiedUser.updatedAt.getTime()
      const otpAgeMs = otpAge / 1000 /* Convert to milliseconds */

      if (otpAgeMs > parseInt(this.config.get('OTP_VALIDATION_SECONDS'))) {
        throw new InvalidOrExpiredException('OTP has expired.')
      }

      if (unverifiedUser.otp !== otp) {
        throw new UnauthorizedException('Invalid OTP.')
      }
    }
  }
}
