export * from './client.types'
export * from './message.types'
export * from './response.types'
export * from './ws.types'

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: Record<string, any>
}
