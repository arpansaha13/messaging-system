import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { isNullOrUndefined } from '@arpansaha13/utils'
import { CONTACTS_API_TAG, FETCH_BASE_URL } from '../constants'
import type { IContact, IUser } from '@shared/types/client'

interface IPostCreateContactBody {
  userIdToAdd: IUser['id']
  alias: IContact['alias']
}

interface IPatchContactAliasBody {
  new_alias: IContact['alias']
}

export const contactsApiSlice = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: FETCH_BASE_URL }),
  reducerPath: 'contacts',
  tagTypes: [CONTACTS_API_TAG],

  endpoints: build => ({
    getContacts: build.query<Record<string, IContact[]>, void>({
      query: () => 'contacts',
      providesTags: (_result, _error) => [{ type: CONTACTS_API_TAG }],
    }),
    addContact: build.mutation<IContact, IPostCreateContactBody>({
      query: body => ({
        url: 'contacts',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: CONTACTS_API_TAG }],
    }),
    patchContactAlias: build.mutation<void, { contactId: IContact['id']; newAlias: IContact['alias'] }>({
      query: ({ contactId, newAlias }) => ({
        url: `contacts/${contactId}`,
        method: 'PATCH',
        body: { new_alias: newAlias } as IPatchContactAliasBody,
      }),
      invalidatesTags: [{ type: CONTACTS_API_TAG }],
    }),
    deleteContact: build.mutation<void, IContact['id']>({
      query: contactId => ({
        url: `contacts/${contactId}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: CONTACTS_API_TAG }],
    }),
  }),
})

export const { useGetContactsQuery, useAddContactMutation, usePatchContactAliasMutation, useDeleteContactMutation } =
  contactsApiSlice
