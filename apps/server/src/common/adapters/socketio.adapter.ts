import { INestApplicationContext } from '@nestjs/common'
import { IoAdapter } from '@nestjs/platform-socket.io'
import { ServerOptions } from 'socket.io'
import { ConfigService } from '@nestjs/config'
import type { EnvVariables } from 'src/env.types'

export class SocketIoAdapter extends IoAdapter {
  constructor(
    private readonly app: INestApplicationContext,
    private readonly configService: ConfigService<EnvVariables>,
  ) {
    super(app)
  }

  createIOServer(_port: number, options?: ServerOptions) {
    // const port = this.configService.get<number>('SOCKET.IO_PORT') ?? 4500
    const origins = this.configService.get<string>('CORS_ORIGINS')
    const origin = origins.split(',')
    options.cors = { origin }
    const server = super.createIOServer(_port, options)
    return server
  }
}
