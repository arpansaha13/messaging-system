import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common'
import { AuthService } from './auth.service'
import { SignInDto, SignUpDto } from './auth.dto'
import type { JwtToken } from './jwt.types'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.CREATED)
  @Post('/sign-up')
  signUp(@Body() credentials: SignUpDto): Promise<JwtToken> {
    return this.authService.signUp(credentials)
  }

  @Post('/sign-in')
  login(@Body() credentials: SignInDto): Promise<JwtToken> {
    return this.authService.login(credentials)
  }
}
