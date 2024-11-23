import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface Notification {
  status: 'success' | 'error'
  title: string
  description: string
  show: boolean
}

interface NotificationSliceType {
  notification: Notification
}

const initialState: NotificationSliceType = {
  notification: {
    status: 'success',
    title: '',
    description: '',
    show: false,
  },
}

export const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    setNotification: (state, action: PayloadAction<Notification>) => {
      state.notification = { ...action.payload }
    },
    toggleNotification: (state, action: PayloadAction<boolean | undefined>) => {
      state.notification.show = action.payload !== undefined ? action.payload : !state.notification.show
    },
  },
  selectors: {
    selectNotification: slice => slice.notification,
  },
})

export const { setNotification, toggleNotification } = notificationSlice.actions
export const { selectNotification } = notificationSlice.selectors
