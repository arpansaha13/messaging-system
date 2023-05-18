export interface DevEnvVariables extends JwtEnvVariables {
  DB_HOST: string
  DB_PORT: number
  DB_USER: string
  DB_PWD: string
  DB_NAME: string

  SERVER_PORT: number
}

export interface ProdEnvVariables extends JwtEnvVariables {
  DB_PROD_URL: string
  // SSL_CERT: string
}

export interface JwtEnvVariables {
  JWT_SECRET: string
  JWT_TOKEN_VALIDITY_SECONDS: number
}
