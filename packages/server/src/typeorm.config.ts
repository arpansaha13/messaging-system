import type { ConfigService } from '@nestjs/config'
import type { TypeOrmModuleAsyncOptions } from '@nestjs/typeorm'
import type { DevEnvVariables, ProdEnvVariables } from '../env/env.types'

export const dbConfigDev: TypeOrmModuleAsyncOptions['useFactory'] = (
  configService: ConfigService<DevEnvVariables>,
) => ({
  type: 'postgres',
  host: configService.get('DB_HOST'),
  port: configService.get('DB_PORT'),
  username: configService.get('DB_USER'),
  password: configService.get('DB_PWD'),
  database: configService.get('DB_NAME'),
  autoLoadEntities: true,
  synchronize: true, // Do not use in production
})

export const dbConfigProd: TypeOrmModuleAsyncOptions['useFactory'] = (
  configService: ConfigService<ProdEnvVariables>,
) => ({
  type: 'postgres',
  url: configService.get('DB_PROD_URL'),
  ssl: {
    rejectUnauthorized: false,
  },
  entities: ['dist/src/**/*.entity.js'],
  migrations: ['dist/db/migrations/*.js'],
  synchronize: false,
})
