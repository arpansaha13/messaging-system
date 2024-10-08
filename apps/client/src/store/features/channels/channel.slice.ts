import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { IChannel, IGroup } from '@shared/types/client'

interface IChannelSlice {
  channelsMap: Map<IGroup['id'], IChannel[]>
}

const initialState: IChannelSlice = {
  channelsMap: new Map(),
}

export const channelSlice = createSlice({
  name: 'channel',
  initialState,
  reducers: {
    insertChannels: (state, action: PayloadAction<{ groupId: IGroup['id']; channels: IChannel[] }>) => {
      const { groupId, channels } = action.payload
      if (!state.channelsMap.has(groupId)) {
        state.channelsMap.set(groupId, channels)
      }
    },
  },
  selectors: {
    selectChannels: (slice, groupId: IGroup['id']) => slice.channelsMap.get(groupId),
  },
})

export const { insertChannels } = channelSlice.actions
export const { selectChannels } = channelSlice.selectors
