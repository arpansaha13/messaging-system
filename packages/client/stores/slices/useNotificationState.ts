import produce from 'immer'
import type { StateCreator } from 'zustand'

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
  setNotification: (notification: Omit<NotificationType, 'show'>) => void

  toggleNotification: (bool?: boolean) => void
}

/** The global notification component is used only in the auth layout (for now). The global notification will show or hide with content depending on the state of this store. */
export const useNotificationState: StateCreator<NotificationStateType, [], [], NotificationStateType> = set => ({
  notification: {
    status: 'success',
    title: '',
    description: '',
    show: false,
  },
  setNotification(newState) {
    set(state => ({ notification: { show: state.notification.show, ...newState } }))
  },
  toggleNotification(bool) {
    set(
      produce((state: NotificationStateType) => {
        if (typeof bool !== 'undefined') {
          state.notification.show = bool
        } else {
          state.notification.show = !state.notification.show
        }
      }),
    )
  },
})
