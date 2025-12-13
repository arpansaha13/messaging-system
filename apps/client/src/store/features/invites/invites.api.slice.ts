import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { FETCH_BASE_URL, INVITE_API_TAG } from '../constants'
import type { IInvite } from '~/types'

interface IAcceptInviteResponse {
  groupId: number
  channels: number[]
}

export const invitesApiSlice = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: FETCH_BASE_URL }),
  reducerPath: 'invites',
  tagTypes: [INVITE_API_TAG],
  endpoints: build => ({
    getInvite: build.query<IInvite, string>({
      query: hash => `invites/${hash}`,
      providesTags: (_result, _error, id) => [{ type: INVITE_API_TAG, id }],
    }),
    acceptInvite: build.mutation<IAcceptInviteResponse, string>({
      query: hash => ({ url: `invites/${hash}/accept`, method: 'POST' }),
      invalidatesTags: (_result, _error, id) => [{ type: INVITE_API_TAG, id }],
    }),
  }),
})

export const { useGetInviteQuery, useAcceptInviteMutation } = invitesApiSlice

export const { invalidateTags } = invitesApiSlice.util
