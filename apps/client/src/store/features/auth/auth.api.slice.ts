import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

interface ILoginBody {
  email: string
  password: string
}

interface ISignupBody {
  email: string
  globalName: string
  password: string
  confirmPassword: string
}

interface IVerificationBody {
  otp: string
}

export const authApiSlice = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }), // Adjust the base URL as necessary
  reducerPath: 'authApi',

  endpoints: builder => ({
    login: builder.mutation<void, ILoginBody>({
      query: body => ({
        url: 'auth/login',
        method: 'POST',
        body,
      }),
    }),
    signUp: builder.mutation<void, ISignupBody>({
      query: body => ({
        url: 'auth/sign-up',
        method: 'POST',
        body,
      }),
    }),
    verify: builder.mutation<void, { hash: string; body: IVerificationBody }>({
      query: ({ hash, body }) => ({
        url: `auth/verification/${hash}`,
        method: 'POST',
        body,
      }),
    }),
    logout: builder.mutation<void, void>({
      query: () => ({
        url: 'auth/logout',
        method: 'POST',
      }),
    }),
  }),
})

export const { useLoginMutation, useSignUpMutation, useVerifyMutation, useLogoutMutation } = authApiSlice
