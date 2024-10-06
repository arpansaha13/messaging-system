import { _getGroups } from '~/utils/api'
import type { Slice } from '~/store/types.store'
import type { ChannelSliceType } from './types'

export const channelSlice: Slice<ChannelSliceType> = set => ({
  channelsMap: new Map(),

  insertChannels(groupId, channels) {
    set(state => {
      if (!state.channelsMap.has(groupId)) {
        state.channelsMap.set(groupId, channels)
      }
    })
  },
})
