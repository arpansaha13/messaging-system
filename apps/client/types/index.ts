export * from './client.types'
export * from './message.types'
export * from './response.types'

export interface RequestOptions extends Omit<RequestInit, 'body' | 'method'> {
  /** @default 'GET' */
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT'

  body?: Record<string, any>
}
