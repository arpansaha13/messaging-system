import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { FETCH_BASE_URL, GROUP_BASE_API_TAG, GROUP_CHANNELS_API_TAG } from '../constants'
import type { IChannel, IGroup } from '@shared/types/client'

interface IPostCreateGroupBody {
  name: string
}

export const groupsApiSlice = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: FETCH_BASE_URL }),
  reducerPath: 'groups',
  tagTypes: [GROUP_BASE_API_TAG, GROUP_CHANNELS_API_TAG],

  endpoints: build => ({
    getGroups: build.query<IGroup[], void>({
      query: () => 'groups',
      providesTags: (_result, _error) => [{ type: GROUP_BASE_API_TAG }],
    }),
    getGroup: build.query<IGroup, IGroup['id']>({
      query: groupId => `groups/${groupId}`,
      providesTags: (_result, _error, id) => [{ type: GROUP_BASE_API_TAG, id }],
    }),
    getChannels: build.query<IChannel[], IGroup['id']>({
      query: groupId => `groups/${groupId}/channels`,
      providesTags: (_result, _error, id) => [{ type: GROUP_CHANNELS_API_TAG, id }],
    }),
    addGroup: build.mutation<IGroup, IPostCreateGroupBody>({
      query: body => ({
        url: 'groups',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: GROUP_BASE_API_TAG }],
    }),
  }),
})

export const { useGetGroupQuery, useGetGroupsQuery, useGetChannelsQuery, useAddGroupMutation } = groupsApiSlice
