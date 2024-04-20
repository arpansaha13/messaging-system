interface TypeormEnvVariables {
  TYPEORM_HOST?: string
  TYPEORM_PORT?: number
  TYPEORM_USERNAME?: string
  TYPEORM_PASSWORD?: string
  TYPEORM_DATABASE?: string
  TYPEORM_DATABASE_URL?: string
}

export interface JwtEnvVariables {
  JWT_SECRET: string
  JWT_TOKEN_VALIDITY_SECONDS: number
}

export interface EnvVariables extends TypeormEnvVariables, JwtEnvVariables {
  NODE_ENV: 'development' | 'production'
  API_PORT: number
  'SOCKET.IO_PORT': number
  CLIENT_DOMAIN: string
  CORS_ORIGINS: string
  OTP_VALIDATION_SECONDS: number
}
