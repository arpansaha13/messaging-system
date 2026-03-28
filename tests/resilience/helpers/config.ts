export const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL ?? 'http://localhost:7530'
export const SOCKET_BASE_URL = process.env.SOCKET_BASE_URL ?? 'http://localhost:7540'
export const SOCKET_ORIGIN = process.env.SOCKET_ORIGIN ?? 'http://localhost:7500'
export const AUTH_GRPC_ADDRESS = process.env.AUTH_GRPC_ADDRESS ?? 'localhost:7541'

export const AUTH_DB_URL =
  process.env.AUTH_DB_URL ?? 'postgresql://testuser:testpass@localhost:7511/auth_resilience_db'
export const MESSAGING_DB_URL =
  process.env.MESSAGING_DB_URL ?? 'postgresql://testuser:testpass@localhost:7521/messaging_resilience_db'

export const MEMCACHED_ADDRESS = process.env.MEMCACHED_ADDRESS ?? 'localhost:7542'
export const AUTH_CACHE_ADDRESS = process.env.AUTH_CACHE_ADDRESS ?? 'localhost:7543'
