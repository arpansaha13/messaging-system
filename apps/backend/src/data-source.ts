import 'reflect-metadata'
import { DataSource } from 'typeorm'

// This file should not have multiple exports
// Error during running migrations: Given data source file must contain only one export of DataSource instance

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 7000, // postgres port-forward
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'messaging_db',
  synchronize: false,
  logging: process.env.DB_LOGGING === 'true' ? true : false,

  // If the data-source.js generated after build is used, the .js extension will be required.
  entities: [__dirname + '/models/*.{ts,js}'],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
})

export default AppDataSource
