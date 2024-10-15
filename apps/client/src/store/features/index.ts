import { darkModeSlice } from './dark/dark.slice'
import { draftSlice } from './drafts/draft.slice'
import { groupSlice } from './groups/group.slice'
import { typingSlice } from './typing/typing.slice'
import { contactSlice } from './contacts/contact.slice'
import { messageSlice } from './messages/message.slice'
import { channelSlice } from './channels/channel.slice'
import { chatListSlice } from './chat-list/chat-list.slice'
import { notificationSlice } from './notification/notification.slice'
import { usersApiSlice } from './users/users.api.slice'
import { groupsApiSlice } from './groups/groups.api.slice'

export const slices = [
  darkModeSlice,
  draftSlice,
  groupSlice,
  typingSlice,
  contactSlice,
  messageSlice,
  channelSlice,
  chatListSlice,
  notificationSlice,
]

export const apiSlices = [usersApiSlice, groupsApiSlice] as const

type UnionOfKeys<T> = T extends { endpoints: infer U } ? keyof U : never
type AllKeys<T extends readonly any[]> = UnionOfKeys<T[number]>

type ApiSliceArray = typeof apiSlices
export type EndpointNames = AllKeys<ApiSliceArray>
export type EndpointSliceMap = Record<EndpointNames, ApiSliceArray[number]>

export const endpointSliceMap = {} as EndpointSliceMap

apiSlices.forEach(apiSlice => {
  const endpoints = Object.keys(apiSlice.endpoints) as Array<keyof typeof apiSlice.endpoints>
  endpoints.forEach(endpointName => {
    endpointSliceMap[endpointName as EndpointNames] = apiSlice
  })
})
