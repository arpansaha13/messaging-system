import { useSearchParams } from 'next/navigation'
import { createContext, useContext, useMemo } from 'react'
import { useGetUserQuery } from '~/store/features/users/users.api.slice'

type IChatContext = ReturnType<typeof useGetUserQuery>

interface IChatProviderProps {
  children: React.ReactNode
}

const ChatContext = createContext<IChatContext | null>(null)

export default function ChatProvider(props: Readonly<IChatProviderProps>) {
  const { children } = props

  const searchParams = useSearchParams()
  const receiverId = useMemo(() => parseInt(searchParams.get('to')! as string), [searchParams])
  const getUserQueryResult = useGetUserQuery(receiverId)

  const value = useMemo(() => getUserQueryResult, [getUserQueryResult])

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export function useChatContext() {
  return useContext(ChatContext)
}
