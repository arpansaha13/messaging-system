import { DataSource, type DataSourceOptions } from 'typeorm'

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  url: '',
  ssl: {
    rejectUnauthorized: false,
  },
  entities: ['dist/src/**/*.entity.js'],
  migrations: ['dist/db/migrations/*.js'],
}

const dataSource = new DataSource(dataSourceOptions)

export default dataSource
