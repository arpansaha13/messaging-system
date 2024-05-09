import { NestFactory } from '@nestjs/core'
import { ConfigService } from '@nestjs/config'
import { ValidationPipe } from '@nestjs/common'
import helmet from 'helmet'
// import session from 'express-session'
import cookieParser from 'cookie-parser'
import { SocketIoAdapter } from 'src/common/adapters/socketio.adapter'
import { AppModule } from './app.module'
import type { EnvVariables } from './env.types'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const configService = app.get(ConfigService<EnvVariables>)

  app.use(helmet())
  app.use(cookieParser())

  // TODO: Use a session store
  // https://github.com/expressjs/session?tab=readme-ov-file#compatible-session-stores
  // app.use(
  //   session({
  //     secret: configService.get('SESSION_SECRET'),
  //     resave: false,
  //     saveUninitialized: false,
  //     cookie: { secure: true },
  //   }),
  // )

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidUnknownValues: true,
      forbidNonWhitelisted: true,
    }),
  )

  app.setGlobalPrefix('/api', { exclude: ['/'] })

  const corsOrigins = configService.get('CORS_ORIGINS').split(',')
  app.enableCors({
    credentials: true,
    origin: corsOrigins,
  })

  app.useWebSocketAdapter(new SocketIoAdapter(app, configService))

  await app.listen(configService.get('API_PORT') ?? 4000)
}

bootstrap()
