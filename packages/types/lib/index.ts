export * from './socket'
export * from './message'
export * from './response-from-backend'

export interface RequestOptions {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: Record<string, any>
}
