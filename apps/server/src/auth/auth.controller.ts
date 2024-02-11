import { Body, Controller, Post, HttpCode, HttpStatus, Param, Get } from '@nestjs/common'
import { AuthService } from './auth.service'
import { SignInDto, SignUpDto, VerifyAccountDto, VerifyAccountParams } from './auth.dto'
import type { JwtToken } from './jwt.types'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/sign-up')
  signUp(@Body() credentials: SignUpDto): Promise<string> {
    return this.authService.signUp(credentials)
  }

  @Post('/sign-in')
  login(@Body() credentials: SignInDto): Promise<JwtToken> {
    return this.authService.login(credentials)
  }

  @Get('/validate-link/account/:hash')
  validateVerificationLink(@Param() params: VerifyAccountParams) {
    return this.authService.validateVerificationLink(params.hash)
  }

  @HttpCode(HttpStatus.CREATED)
  @Post('/verification/:hash')
  verifyAccount(@Param() params: VerifyAccountParams, @Body() body: VerifyAccountDto): Promise<string> {
    return this.authService.verifyAccount(params.hash, body.otp)
  }
}
