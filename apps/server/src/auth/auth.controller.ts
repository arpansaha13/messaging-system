import { Body, Controller, Post } from '@nestjs/common'
// Service
import { AuthService } from './auth.service'
// DTO
import { SignInDto, SignUpDto } from './auth.dto'
// Types
import { JwtToken } from './jwt.types'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/sign-up')
  signUp(@Body() credentials: SignUpDto): Promise<JwtToken> {
    return this.authService.signUp(credentials)
  }
  @Post('/sign-in')
  signIn(@Body() credentials: SignInDto): Promise<JwtToken> {
    return this.authService.signIn(credentials)
  }
}
