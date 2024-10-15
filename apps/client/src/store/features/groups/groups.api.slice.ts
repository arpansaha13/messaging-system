import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { FETCH_BASE_URL, GROUPS_API_BASE_TAG } from '../constants'
import type { IGroup } from '@shared/types/client'

export const groupsApiSlice = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: FETCH_BASE_URL }),
  reducerPath: 'groups',
  tagTypes: [GROUPS_API_BASE_TAG],
  endpoints: build => ({
    getGroup: build.query<IGroup, IGroup['id']>({
      query: groupId => `groups/${groupId}`,
      providesTags: (result, error, id) => [{ type: GROUPS_API_BASE_TAG, id }],
    }),
  }),
})

export const { useGetGroupQuery } = groupsApiSlice
