export * from './socket'
export * from './message'
export * from './response-from-backend'
export * from './response-from-next-server'

export interface RequestOptions {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: Record<string, any>
}
