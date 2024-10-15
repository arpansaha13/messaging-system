import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { AUTH_USER_API_BASE_TAG, FETCH_BASE_URL } from '../constants'
import type { IAuthUser } from '@shared/types/client'

export const usersApiSlice = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: FETCH_BASE_URL }),
  reducerPath: 'users',
  tagTypes: [AUTH_USER_API_BASE_TAG],
  endpoints: build => ({
    getAuthUser: build.query<IAuthUser, void>({
      query: () => '/users/me',
      providesTags: () => [{ type: AUTH_USER_API_BASE_TAG }],
    }),
    patchAuthUser: build.mutation<IAuthUser, Partial<Pick<IAuthUser, 'bio' | 'globalName'>>>({
      query: body => ({
        url: '/users/me',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: [{ type: AUTH_USER_API_BASE_TAG }],
    }),
  }),
})

export const { useGetAuthUserQuery, usePatchAuthUserMutation } = usersApiSlice
