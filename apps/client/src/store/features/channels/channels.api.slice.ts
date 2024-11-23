import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { FETCH_BASE_URL, CHANNEL_API_TAG } from '../constants'
import type { IChannel } from '@shared/types/client'

export const channelsApiSlice = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: FETCH_BASE_URL }),
  reducerPath: 'channels',
  tagTypes: [CHANNEL_API_TAG],

  endpoints: build => ({
    getChannel: build.query<IChannel, IChannel['id']>({
      query: channelId => `channels/${channelId}`,
      providesTags: (_result, _error, id) => [{ type: CHANNEL_API_TAG, id }],
    }),
  }),
})

export const { useGetChannelQuery } = channelsApiSlice
