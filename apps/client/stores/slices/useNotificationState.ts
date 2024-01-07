import type { Slice } from '~/stores/types.store'

interface NotificationType {
  status: 'success' | 'error'
  title: string
  description: string
  /** Show or hide the notification */
  show: boolean
}

export interface NotificationStateType {
  notification: NotificationType

  /** Update the show or hide state of notification. */
  setNotification: (notification: NotificationType) => void

  toggleNotification: (bool?: boolean) => void
}

/** The global notification component is used only in the auth layout (for now). The global notification will show or hide with content depending on the state of this store. */
export const useNotificationState: Slice<NotificationStateType> = set => ({
  notification: {
    status: 'success',
    title: '',
    description: '',
    show: false,
  },
  setNotification(newState) {
    set({ notification: { ...newState } })
  },
  toggleNotification(bool) {
    set((state: NotificationStateType) => {
      if (typeof bool !== 'undefined') {
        state.notification.show = bool
      } else {
        state.notification.show = !state.notification.show
      }
    })
  },
})
