export interface EnvironmentVariables {
  DB_HOST: string
  DB_PORT: number
  DB_USER: string
  DB_PWD: string
  DB_NAME: string

  SERVER_PORT: number

  JWT_SECRET: string
  JWT_TOKEN_VALIDITY_SECONDS: number
}
