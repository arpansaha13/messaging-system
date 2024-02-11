import { HttpException } from '@nestjs/common'

export class InvalidOrExpiredException extends HttpException {
  constructor(message: string | Record<string, any>) {
    super(message, 498)
  }
}
