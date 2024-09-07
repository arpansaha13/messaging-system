import type { Slice } from '~/store/types.store'
import type { NotificationSliceType } from './types'

/** The global notification component is used only in the auth layout (for now). The global notification will show or hide with content depending on the state of this store. */
export const notificationSlice: Slice<NotificationSliceType> = set => ({
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
    set(state => {
      if (typeof bool !== 'undefined') {
        state.notification.show = bool
      } else {
        state.notification.show = !state.notification.show
      }
    })
  },
})
