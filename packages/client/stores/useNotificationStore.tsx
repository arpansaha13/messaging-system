import create from 'zustand'

interface NotificationStoreType {
  status: 'success' | 'error'
  title: string
  description: string

  /** Show or hide the notification */
  show: boolean

  /** Update the show or hide state of notification. */
  setNotification: (newState: Partial<Omit<NotificationStoreType, 'setNotification'>>) => void
}

/** The global notification component is used only in the auth layout (for now). The global notification will show or hide with content depending on the state of this store. */
export const useNotificationStore = create<NotificationStoreType>()(
  (set) => ({
    status: 'success',
    title: '',
    description: '',
    show: false,
    setNotification(newState) {
      set(() => ({...newState}))
    }
  }),
)
