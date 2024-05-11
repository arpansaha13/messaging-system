import { DataSource, type DataSourceOptions } from 'typeorm'
import { config as dotEnvConfig } from 'dotenv'

dotEnvConfig()

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.TYPEORM_HOST,
  port: parseInt(process.env.TYPEORM_PORT ?? '5432'),
  database: process.env.TYPEORM_DATABASE,
  username: process.env.TYPEORM_USERNAME,
  password: process.env.TYPEORM_PASSWORD,
  ssl: {
    rejectUnauthorized: false,
  },
  entities: ['dist/**/*.entity.js'],
  migrations: ['migrations/*.ts'],
}

const dataSource = new DataSource(dataSourceOptions)

export default dataSource
