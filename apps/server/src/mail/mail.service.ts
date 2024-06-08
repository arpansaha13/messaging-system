import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { MailerService } from '@nestjs-modules/mailer'

@Injectable()
export class MailService {
  constructor(
    private config: ConfigService,
    private mailerService: MailerService,
  ) {}

  async sendVerificationMail(email: string, name: string, hash: string, otp: string) {
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
