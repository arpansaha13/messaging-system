export * from './id'
export * from './message'
export * from './socket'
export * from './response-from-backend'
export * from './models'

export interface RequestOptions {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: Record<string, any>
}
