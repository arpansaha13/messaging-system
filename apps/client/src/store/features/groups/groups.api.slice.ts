import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import {
  ALL_GROUPS_API_TAG,
  FETCH_BASE_URL,
  GROUP_API_TAG,
  GROUP_CHANNELS_API_TAG,
  GROUP_MEMBERS_API_TAG,
} from '../constants'
import type { IChannel, IGroup, IUser } from '@shared/types/client'

interface IPostCreateGroupBody {
  name: IGroup['name']
}
interface IPostCreateChannel {
  groupId: IGroup['id']
  body: {
    name: IChannel['name']
  }
}

export const groupsApiSlice = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: FETCH_BASE_URL }),
  reducerPath: 'groups',
  tagTypes: [ALL_GROUPS_API_TAG, GROUP_API_TAG, GROUP_CHANNELS_API_TAG, GROUP_MEMBERS_API_TAG],

  endpoints: build => ({
    getGroups: build.query<IGroup[], void>({
      query: () => 'groups',
      providesTags: (_result, _error) => [{ type: ALL_GROUPS_API_TAG }],
    }),
    getGroup: build.query<IGroup, IGroup['id']>({
      query: groupId => `groups/${groupId}`,
      providesTags: (_result, _error, id) => [{ type: GROUP_API_TAG, id }],
    }),
    getChannels: build.query<IChannel[], IGroup['id']>({
      query: groupId => `groups/${groupId}/channels`,
      providesTags: (_result, _error, id) => [{ type: GROUP_CHANNELS_API_TAG, id }],
    }),
    getGroupMembers: build.query<IUser[], IGroup['id']>({
      query: groupId => `groups/${groupId}/members`,
      providesTags: (_result, _error, id) => [{ type: GROUP_MEMBERS_API_TAG, id }],
    }),
    addGroup: build.mutation<IGroup, IPostCreateGroupBody>({
      query: body => ({
        url: 'groups',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: ALL_GROUPS_API_TAG }],
    }),
    addChannel: build.mutation<IGroup, IPostCreateChannel>({
      query: ({ groupId, body }) => ({
        url: `groups/${groupId}/channels`,
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: GROUP_CHANNELS_API_TAG }],
    }),
  }),
})

export const {
  useGetGroupQuery,
  useGetGroupsQuery,
  useGetChannelsQuery,
  useGetGroupMembersQuery,
  useAddGroupMutation,
  useAddChannelMutation,
} = groupsApiSlice
