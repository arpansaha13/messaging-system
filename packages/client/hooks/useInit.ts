import { useEffect } from 'react'
import { enableMapSet } from 'immer'

// Stores
import { useUserStore } from '../stores/useUserStore'
import { useChatListStore } from '../stores/useChatListStore'

/**
 * Initialise all required states for the app
 */
export function useInit() {
  // Enable Maps for `Immer`
  enableMapSet()

  const initUserStore = useUserStore(state => state.init)
  const initChatListStore = useChatListStore(state => state.init)

  // Initialize users
  useEffect(() => {
    const initUsersData = [
      {
        userTag: 'first',
        name: 'Calvin Hawkins',
        dp: 'https://images.unsplash.com/photo-1491528323818-fdd1faba62cc?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      },
      {
        userTag: 'second',
        name: 'Kristen Ramos',
        dp: 'https://images.unsplash.com/photo-1550525811-e5869dd03032?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      },
      {
        userTag: 'third',
        name: 'Ted Fox',
        dp: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      },
    ]
    initUserStore(initUsersData)
  }, [initUserStore])

  // Initialize chat list
  useEffect(() => {
    const initChatListData = [
      {
        userTag: 'first',
        name: 'Calvin Hawkins',
        dp: 'https://images.unsplash.com/photo-1491528323818-fdd1faba62cc?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
        latestMsg: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
        muted: false,
        read: true,
        time: '3:49 AM',
      },
      {
        userTag: 'second',
        name: 'Kristen Ramos',
        dp: 'https://images.unsplash.com/photo-1550525811-e5869dd03032?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
        latestMsg: 'Latest text message',
        muted: false,
        read: true,
        time: '3:49 AM',
      },
      {
        userTag: 'third',
        name: 'Ted Fox',
        dp: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
        latestMsg: 'Latest text message',
        muted: false,
        read: true,
        time: '3:49 AM',
      },
    ]
    initChatListStore(initChatListData)
  }, [initChatListStore])
}
