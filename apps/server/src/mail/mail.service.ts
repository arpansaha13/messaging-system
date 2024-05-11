import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { MailerService } from '@nestjs-modules/mailer'
import { UnverifiedUser } from 'src/auth/auth.entity'

@Injectable()
export class MailService {
  constructor(private config: ConfigService, private mailerService: MailerService) {}

  async sendVerificationMail(email: string, name: string, hash: string, otp: string) {
    const url = `${this.config.get('CLIENT_DOMAIN')}/auth/verification/${hash}`

    await this.mailerService.sendMail({
      to: email,
      subject: 'Welcome to my WhatsApp Clone project!',
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
