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

export const apiSlices = [usersApiSlice] as const

type ApiSlice = (typeof apiSlices)[number]
export type EndpointNames = keyof ApiSlice['endpoints']
export type EndpointSliceMap = Record<EndpointNames, ApiSlice>

export const endpointSliceMap = {} as EndpointSliceMap

apiSlices.forEach(apiSlice => {
  const endpoints = Object.keys(apiSlice.endpoints) as Array<keyof typeof apiSlice.endpoints>
  endpoints.forEach(endpointName => {
    endpointSliceMap[endpointName as EndpointNames] = apiSlice
  })
})
