import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { FETCH_BASE_URL, GROUP_BASE_API_TAG, GROUP_CHANNELS_API_TAG } from '../constants'
import type { IChannel, IGroup } from '@shared/types/client'

export const groupsApiSlice = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: FETCH_BASE_URL }),
  reducerPath: 'groups',
  tagTypes: [GROUP_BASE_API_TAG, GROUP_CHANNELS_API_TAG],
  endpoints: build => ({
    getGroup: build.query<IGroup, IGroup['id']>({
      query: groupId => `groups/${groupId}`,
      providesTags: (_result, _error, id) => [{ type: GROUP_BASE_API_TAG, id }],
    }),
    getChannels: build.query<IChannel[], IGroup['id']>({
      query: groupId => `groups/${groupId}/channels`,
      providesTags: (_result, _error, id) => [{ type: GROUP_CHANNELS_API_TAG, id }],
    }),
  }),
})

export const { useGetGroupQuery, useGetChannelsQuery } = groupsApiSlice
