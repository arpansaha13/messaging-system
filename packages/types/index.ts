export * from './client.types'
export * from './message.types'
export * from './response.types'
export * from './ws.types'

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: Record<string, any>
}
