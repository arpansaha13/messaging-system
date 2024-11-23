import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { MailerService } from '@nestjs-modules/mailer'
import type { UnverifiedUser } from 'src/auth/unverified-user.entity'

@Injectable()
export class MailService {
  constructor(
    private config: ConfigService,
    private mailerService: MailerService,
  ) {}

  async sendVerificationMail(
    email: UnverifiedUser['email'],
    name: UnverifiedUser['globalName'],
    hash: UnverifiedUser['hash'],
    otp: UnverifiedUser['otp'],
  ) {
    const url = `${this.config.get('CLIENT_DOMAIN')}/auth/verification/${hash}`

    await this.mailerService.sendMail({
      to: email,
      subject: 'Welcome to my Messaging System project!',
      template: './verification', // `.hbs` extension is appended automatically
      context: {
        // ✏️ filling curly brackets with content
        url,
        otp,
        name,
      },
    })
  }
}
