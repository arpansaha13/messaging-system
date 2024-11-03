import { darkModeSlice } from './dark/dark.slice'
import { draftSlice } from './drafts/draft.slice'
import { typingSlice } from './typing/typing.slice'
import { messageSlice } from './messages/message.slice'
import { chatListSlice } from './chat-list/chat-list.slice'
import { notificationSlice } from './notification/notification.slice'
import { authApiSlice } from './auth/auth.api.slice'
import { usersApiSlice } from './users/users.api.slice'
import { groupsApiSlice } from './groups/groups.api.slice'
import { contactsApiSlice } from './contacts/contact.api.slice'

export const slices = [darkModeSlice, draftSlice, typingSlice, messageSlice, chatListSlice, notificationSlice]

export const apiSlices = [authApiSlice, usersApiSlice, groupsApiSlice, contactsApiSlice] as const

type UnionOfKeys<T> = T extends { endpoints: infer U } ? keyof U : never
type AllKeys<T extends readonly any[]> = UnionOfKeys<T[number]>

type ApiSliceArray = typeof apiSlices
export type EndpointNames = AllKeys<ApiSliceArray>

export type EndpointSliceMap = {
  [K in EndpointNames]: ApiSliceArray extends readonly (infer U)[]
    ? U extends { endpoints: Record<K, any> }
      ? U
      : never
    : never
}

export const endpointSliceMap = {} as EndpointSliceMap

apiSlices.forEach(apiSlice => {
  const endpoints = Object.keys(apiSlice.endpoints) as EndpointNames[]
  endpoints.forEach(endpointName => {
    endpointSliceMap[endpointName] = apiSlice as any
  })
})
