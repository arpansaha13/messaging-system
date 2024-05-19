import { Body, Controller, Post, HttpCode, HttpStatus, Param, Get, Res, Req } from '@nestjs/common'
import { AuthService } from './auth.service'
import { SignInDto, SignUpDto, VerifyAccountDto, VerifyAccountParams } from './auth.dto'
import type { Request, Response } from 'express'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('/check-auth')
  checkAuth(@Req() request: Request): Promise<{ valid: boolean }> {
    return this.authService.checkAuth(request)
  }

  @Post('/sign-up')
  signUp(@Body() credentials: SignUpDto): Promise<string> {
    return this.authService.signUp(credentials)
  }

  @Post('/sign-in')
  login(@Res() res: Response, @Body() credentials: SignInDto): Promise<Response> {
    return this.authService.login(res, credentials)
  }

  @Post('/logout')
  logout(@Req() request: Request, @Res() res: Response): Promise<Response> {
    return this.authService.logout(request, res)
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
