import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { AUTH_USER_API_TAG, FETCH_BASE_URL, USER_API_TAG } from '../constants'
import type { IAuthUser, IUser, IUserSearchResult } from '@shared/types/client'
import _fetch from '~/utils/api/_fetch'

export const usersApiSlice = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: FETCH_BASE_URL }),
  reducerPath: 'users',
  tagTypes: [AUTH_USER_API_TAG, USER_API_TAG],

  endpoints: build => ({
    getAuthUser: build.query<IAuthUser, void>({
      query: () => 'users/me',
      providesTags: [{ type: AUTH_USER_API_TAG }],
    }),
    patchAuthUser: build.mutation<IAuthUser, Partial<Pick<IAuthUser, 'bio' | 'globalName'>>>({
      query: body => ({
        url: 'users/me',
        method: 'PATCH',
        body,
      }),
      invalidatesTags: [{ type: AUTH_USER_API_TAG }],
    }),
    getUser: build.query<IUser, IUser['id']>({
      query: userId => `users/${userId}`,
      providesTags: (_result, _error, id) => [{ type: USER_API_TAG, id }],
    }),
    searchUsers: build.query<IUserSearchResult[], string>({
      queryFn: async query => {
        try {
          let data = []
          if (query) data = await _fetch(`users/search?text=${query}`)
          return { data }
        } catch (error: any) {
          return { error }
        }
      },
    }),
  }),
})

export const { useGetAuthUserQuery, useGetUserQuery, usePatchAuthUserMutation, useLazySearchUsersQuery } = usersApiSlice

export const { invalidateTags } = usersApiSlice.util
