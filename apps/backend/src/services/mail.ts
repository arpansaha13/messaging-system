export class MailService {
  async sendVerificationMail(email: string, globalName: string, hash: string, otp: string) {
    console.log(`Send verification mail to ${email} with hash ${hash} and otp ${otp}`)
    return Promise.resolve()
  }
}
