import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'

const DEFAULT_NEST_SERVER_PORT = 4000

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidUnknownValues: true,
      forbidNonWhitelisted: true,
    }),
  )

  app.enableCors()
  await app.listen(process.env.SERVER_PORT ?? DEFAULT_NEST_SERVER_PORT)
}
bootstrap()
