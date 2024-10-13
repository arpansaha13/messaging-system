import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { AUTH_USER_ENDPOINT } from './endpoints'
import type { IAuthUser } from '@shared/types/client'

export const usersApiSlice = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: 'api' }),
  reducerPath: 'users',
  tagTypes: ['AuthUser'],
  endpoints: build => ({
    getAuthUser: build.query<IAuthUser, void>({
      query: () => AUTH_USER_ENDPOINT,
      providesTags: () => [{ type: 'AuthUser' }],
    }),
  }),
})

export const { useGetAuthUserQuery } = usersApiSlice
