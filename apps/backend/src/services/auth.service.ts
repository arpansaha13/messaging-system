import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { UserRepository } from '../repositories/user.repository'
import { UnverifiedUserRepository } from '../repositories/unverified-user.repository'
import { MailService } from './mail.service'
import AppDataSource from '../data-source'
import { User } from '../models/user.entity'
import { UnverifiedUser } from '../models/unverified-user.entity'
import { SessionRepository } from '../repositories/session.repository'

const JWT_SECRET = process.env.JWT_SECRET
const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME
const JWT_TOKEN_VALIDITY_SECONDS = Number(process.env.JWT_TOKEN_VALIDITY_SECONDS)

export class AuthService {
  constructor(
    private userRepo = new UserRepository(),
    private sessionRepo = new SessionRepository(),
    private unverifiedRepo = new UnverifiedUserRepository(),
    private mailService = new MailService(),
  ) {}

  private generateOtp(length = 4) {
    let result = ''
    const characters = '0123456789'
    for (let i = 0; i < length; i++) result += characters.charAt(Math.floor(Math.random() * characters.length))
    return result
  }

  private generateHash(length = 8) {
    return Math.random()
      .toString(36)
      .slice(2, 2 + length)
  }

  async checkAuth(req: any) {
    const sessionKey = req.cookies?.[AUTH_COOKIE_NAME]
    if (!sessionKey) return { valid: false }
    const session = await this.sessionRepo.findByKey(sessionKey)
    if (!session) return { valid: false }
    try {
      const payload: any = jwt.verify(session.token, JWT_SECRET)
      const user_id = payload.user_id
      if (!user_id) return { valid: false }
      const exists = await this.userRepo.findById(user_id)
      return { valid: !!exists }
    } catch (err) {
      console.error(err)
      return { valid: false }
    }
  }

  async signUp(credentials: any) {
    const hash = this.generateHash()
    const otp = this.generateOtp()
    const username = credentials.globalName + '-' + Math.random().toString(36).slice(2, 8)

    const hashedPwd = await bcrypt.hash(credentials.password, await bcrypt.genSalt())

    await this.unverifiedRepo.upsert(
      {
        hash,
        otp,
        email: credentials.email,
        username,
        globalName: credentials.globalName,
        password: hashedPwd,
      },
      { conflictPaths: ['email'], skipUpdateIfNoValuesChanged: true } as any,
    )

    await this.mailService.sendVerificationMail(credentials.email, credentials.globalName, hash, otp)
  }

  async login(res: any, credentials: any) {
    const user = await this.userRepo.findByEmail(credentials.email)

    if (user && (await bcrypt.compare(credentials.password, user.password))) {
      const payload = { user_id: user.id }
      const token = jwt.sign(payload, JWT_SECRET)
      const maxAge = JWT_TOKEN_VALIDITY_SECONDS * 1000

      const session = await this.sessionRepo.save(
        this.sessionRepo.create({ token, expiresAt: new Date(Date.now() + maxAge) }),
      )

      res.cookie(AUTH_COOKIE_NAME, session.key, { secure: false, sameSite: true, httpOnly: true, maxAge })
      return res.status(200).send()
    }
    return res.status(401).send({ message: 'Invalid credentials' })
  }

  async logout(req: any, res: any) {
    const sessionKey = req.cookies?.[AUTH_COOKIE_NAME]
    if (sessionKey) await this.sessionRepo.deleteByKey(sessionKey)
    res.cookie(AUTH_COOKIE_NAME, '', { maxAge: 0 })
    return res.status(200).send()
  }

  async validateVerificationLink(hash: string) {
    const isValid = await this.unverifiedRepo.existsByHash(hash)
    return { valid: isValid }
  }

  async verifyAccount(hash: string, otp: string) {
    const unverified = await this.unverifiedRepo.findByHash(hash)
    if (!unverified) throw new Error('Invalid link')
    // simple otp check
    if (unverified.otp !== otp) throw new Error('Invalid otp')
    // create user
    await AppDataSource.manager.transaction(async txn => {
      const newUser = txn.create(User, {
        email: unverified.email,
        globalName: unverified.globalName,
        password: unverified.password,
        username: unverified.username,
      })
      await txn.save(newUser)
      await txn.delete(UnverifiedUser, { hash })
    })
  }
}
