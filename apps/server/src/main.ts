import { NestFactory } from '@nestjs/core'
import { ConfigService } from '@nestjs/config'
import { ValidationPipe } from '@nestjs/common'
import helmet from 'helmet'
import { SocketIoAdapter } from 'src/common/adapters/socketio.adapter'
import { AppModule } from './app.module'
import type { EnvVariables } from './env.types'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const configService = app.get(ConfigService<EnvVariables>)

  app.use(helmet())

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidUnknownValues: true,
      forbidNonWhitelisted: true,
    }),
  )

  app.setGlobalPrefix('/api')

  const corsOrigins = configService.get('CORS_ORIGINS').split(',')
  app.enableCors({
    origin: corsOrigins,
  })

  app.useWebSocketAdapter(new SocketIoAdapter(app, configService))

  await app.listen(configService.get('API_PORT') ?? 4000)
}

bootstrap()
