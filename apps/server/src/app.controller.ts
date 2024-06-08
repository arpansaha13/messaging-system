import { Controller, Get } from '@nestjs/common'

@Controller()
export class AppController {
  @Get()
  home(): string {
    return 'NestJs server for my Messaging System project.'
  }
}
