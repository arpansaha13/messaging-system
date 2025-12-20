import type { Ref } from 'vue'

type NotificationStatus = 'success' | 'error'

export interface AppNotification {
  status: NotificationStatus
  title: string
  description: string
  show: boolean
}

const initialNotification: AppNotification = {
  status: 'success',
  title: '',
  description: '',
  show: false,
}

export function useNotification() {
  const notification = useState<AppNotification>('notification', () => ({ ...initialNotification }))

  function showNotification(payload: Omit<AppNotification, 'show'>) {
    notification.value = {
      ...payload,
      show: true,
    }
  }

  function hideNotification() {
    notification.value = { ...notification.value, show: false }
  }

  function resetNotification() {
    notification.value = { ...initialNotification }
  }

  return {
    notification: notification as Ref<AppNotification>,
    showNotification,
    hideNotification,
    resetNotification,
  }
}


