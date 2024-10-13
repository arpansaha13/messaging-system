import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { IAuthUser } from '@shared/types/client'

export const usersApiSlice = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: 'api' }),
  reducerPath: 'users',
  tagTypes: ['AuthUser'],
  endpoints: build => ({
    getAuthUser: build.query<IAuthUser, void>({
      query: () => '/users/me',
      providesTags: () => [{ type: 'AuthUser' }],
    }),
  }),
})

export const { useGetAuthUserQuery } = usersApiSlice
