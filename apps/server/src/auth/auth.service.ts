import { ConflictException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { InjectRepository, InjectEntityManager } from '@nestjs/typeorm'
import * as bcrypt from 'bcryptjs'
import { isNullOrUndefined, slugify } from '@arpansaha13/utils'
import { InvalidOrExpiredException } from 'src/common/exceptions'
import { User } from 'src/users/user.entity'
import { UserRepository } from 'src/users/user.repository'
import { UnverifiedUser } from './unverified-user.entity'
import { UnverifiedUserRepository } from './unverified-user.repository'
import { LoginDto, SignUpDto } from './auth.dto'
import { MailService } from 'src/mail/mail.service'
import { SessionService } from 'src/sessions/session.service'
import type { EntityManager } from 'typeorm'
import type { Request, Response } from 'express'
import type { EnvVariables } from 'src/env.types'

interface JwtPayload {
  user_id: number
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly sessionService: SessionService,
    private readonly configService: ConfigService<EnvVariables>,

    @InjectEntityManager()
    private manager: EntityManager,
    @InjectRepository(UserRepository)
    private userRepository: UserRepository,
    @InjectRepository(UnverifiedUserRepository)
    private unverifiedUserRepository: UnverifiedUserRepository,
  ) {}

  private generateHash(length = 8) {
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

  private generateOtp(length = 4) {
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

  private generateUsername(globalName: string) {
    const HASH_LENGTH = 6
    const hash = this.generateHash(HASH_LENGTH)
    const separator = '-'
    const USERNAME_MAXLENGTH = 20
    const SLUG_MAXLENGTH_WITHOUT_HASH = USERNAME_MAXLENGTH - HASH_LENGTH - 1
    const slug = slugify(globalName.slice(0, SLUG_MAXLENGTH_WITHOUT_HASH), separator)

    return slug + '-' + hash
  }

  async checkAuth(request: Request): Promise<{ valid: boolean }> {
    const sessionKey = request.cookies[this.configService.get('AUTH_COOKIE_NAME')]

    if (isNullOrUndefined(sessionKey)) return { valid: false }

    const session = await this.sessionService.getSessionById(sessionKey)
    if (isNullOrUndefined(session)) return { valid: false }

    try {
      const payload = this.jwtService.verify(session.token)
      const { user_id } = payload

      if (isNullOrUndefined(user_id)) return { valid: false }

      const userExists = await this.userRepository.exists({
        where: { id: user_id },
      })

      return { valid: userExists }
    } catch (err) {
      console.error(err)
      return { valid: false }
    }
  }

  async signUp(credentials: SignUpDto): Promise<string> {
    // TODO: Verify if the hash already exists in db
    const hash = this.generateHash()
    const otp = this.generateOtp()
    const username = this.generateUsername(credentials.globalName)

    try {
      // TODO: Retry if failed
      await this.manager.transaction(async txnManager => {
        const hashedPwd = await bcrypt.hash(credentials.password, await bcrypt.genSalt())

        if (await this.userRepository.exists({ where: { email: credentials.email } })) {
          throw new ConflictException('This email is already registered.')
        }

        await txnManager.upsert(
          UnverifiedUser,
          {
            hash,
            otp,
            email: credentials.email,
            username,
            globalName: credentials.globalName,
            password: hashedPwd,
          },
          { conflictPaths: ['email'], skipUpdateIfNoValuesChanged: true },
        )
      })

      await this.mailService.sendVerificationMail(credentials.email, credentials.globalName, hash, otp)
      return 'Please verify your account using the link sent to your email.'
    } catch (error) {
      if (error.status === 409) throw error
      console.log(error)
      throw new InternalServerErrorException()
    }
  }

  async login(res: Response, credentials: LoginDto): Promise<Response> {
    const user = await this.userRepository.findOne({
      where: { email: credentials.email },
    })

    if (user !== null && (await bcrypt.compare(credentials.password, user.password))) {
      const payload: JwtPayload = { user_id: user.id }
      const token = this.jwtService.sign(payload)
      const maxAge = this.configService.get('JWT_TOKEN_VALIDITY_SECONDS') * 1000

      const session = await this.sessionService.createSession({ token, expiresAt: new Date(Date.now() + maxAge) })

      res.cookie(this.configService.get('AUTH_COOKIE_NAME'), session.key, {
        path: '/api',
        secure: true,
        sameSite: true,
        httpOnly: true,
        maxAge,
      })

      return res.status(200).send()
    }

    throw new UnauthorizedException('Invalid email or password.')
  }

  async logout(request: Request, res: Response) {
    const sessionKey = request.cookies[this.configService.get('AUTH_COOKIE_NAME')]

    if (!isNullOrUndefined(sessionKey)) {
      await this.sessionService.deleteSession(sessionKey)

      res.cookie(this.configService.get('AUTH_COOKIE_NAME'), '', {
        path: '/api',
        secure: true,
        httpOnly: true,
        maxAge: 0,
      })
    }

    return res.status(200).send()
  }

  async validateVerificationLink(hash: string) {
    const isValid = await this.unverifiedUserRepository.exists({ where: { hash } })
    return { valid: isValid }
  }

  async verifyAccount(hash: string, otp: string): Promise<string> {
    try {
      await this.manager.transaction(async txnManager => {
        const unverifiedUser = await txnManager.findOne(UnverifiedUser, {
          where: { hash },
        })

        if (unverifiedUser === null) {
          throw new InvalidOrExpiredException('Invalid link.')
        }

        verifyOtpAge.call(this, unverifiedUser)

        const newUser = txnManager.create(User, {
          email: unverifiedUser.email,
          globalName: unverifiedUser.globalName,
          password: unverifiedUser.password,
          username: unverifiedUser.username,
        })

        await txnManager.save(newUser)
        await txnManager.delete(UnverifiedUser, { hash })
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

      if (otpAgeMs > parseInt(this.configService.get('OTP_VALIDATION_SECONDS'))) {
        throw new InvalidOrExpiredException('OTP has expired.')
      }

      if (unverifiedUser.otp !== otp) {
        throw new UnauthorizedException('Invalid OTP.')
      }
    }
  }
}
