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
    private readonly configService: ConfigService<EnvVariables>,

    @InjectEntityManager()
    private manager: EntityManager,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UnverifiedUser)
    private unverifiedUserRepository: Repository<UnverifiedUser>,
  ) {}

  private PASSWORD_MISMATCH_EXCEPTION_MESSAGE = 'Password and confirm-password do not match.'

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

  async checkAuth(request: Request): Promise<{ valid: boolean }> {
    const token = request.cookies[this.configService.get('AUTH_COOKIE_NAME')]

    if (!token) return { valid: false }

    try {
      const payload = this.jwtService.verify(token)
      const { user_id } = payload

      if (!user_id) return { valid: false }

      const userExists = await this.userRepository.exists({
        where: { id: user_id },
      })

      return { valid: userExists }
    } catch (err) {
      return { valid: false }
    }
  }

  async signUp(credentials: SignUpDto): Promise<string> {
    if (credentials.password !== credentials.confirmPassword) {
      throw new UnauthorizedException(this.PASSWORD_MISMATCH_EXCEPTION_MESSAGE)
    }

    // TODO: Verify if the hash already exists in db
    const hash = this.generateHash()
    const otp = this.generateOtp()
    let unverifiedUser: UnverifiedUser = null!

    try {
      // TODO: Retry if failed
      await this.manager.transaction(async txnManager => {
        const hashedPwd = await bcrypt.hash(credentials.password, await bcrypt.genSalt())

        unverifiedUser = txnManager.create(UnverifiedUser, {
          hash,
          otp,
          email: credentials.email,
          globalName: credentials.globalName,
          password: hashedPwd,
        })
        await txnManager.save(unverifiedUser)
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

  async login(res: Response, credentials: SignInDto): Promise<Response> {
    const user = await this.userRepository.findOne({
      where: { email: credentials.email },
    })

    if (user !== null && (await bcrypt.compare(credentials.password, user.password))) {
      const payload: JwtPayload = { user_id: user.id }
      const token = this.jwtService.sign(payload)
      const maxAge = this.configService.get('JWT_TOKEN_VALIDITY_SECONDS') * 1000

      res.cookie(this.configService.get('AUTH_COOKIE_NAME'), token, {
        path: '/api',
        secure: true,
        httpOnly: true,
        maxAge,
      })

      return res.status(200).send()
    }

    throw new UnauthorizedException('Invalid email or password.')
  }

  async logout(res: Response) {
    res.cookie(this.configService.get('AUTH_COOKIE_NAME'), '', {
      path: '/api',
      secure: true,
      httpOnly: true,
      maxAge: 0,
    })

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
