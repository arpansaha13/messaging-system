interface NotificationType {
  status: 'success' | 'error'
  title: string
  description: string
  /** Show or hide the notification */
  show: boolean
}

export interface NotificationSliceType {
  notification: NotificationType

  /** Update the show or hide state of notification. */
  setNotification: (notification: NotificationType) => void

  toggleNotification: (bool?: boolean) => void
}