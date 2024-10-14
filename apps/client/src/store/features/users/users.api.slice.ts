import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { FETCH_BASE_URL } from '../constants'
import type { IAuthUser } from '@shared/types/client'

export const usersApiSlice = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: FETCH_BASE_URL }),
  reducerPath: 'users',
  tagTypes: ['AuthUser'],
  endpoints: build => ({
    getAuthUser: build.query<IAuthUser, void>({
      query: () => '/users/me',
      providesTags: () => [{ type: 'AuthUser' }],
    }),
    patchAuthUser: build.mutation<IAuthUser, Partial<Pick<IAuthUser, 'bio' | 'globalName'>>>({
      query: (body) => ({
        url: '/users/me',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: [{ type: 'AuthUser' }],
    }),
  }),
})

export const { useGetAuthUserQuery, usePatchAuthUserMutation } = usersApiSlice
