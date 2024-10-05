import type { Slice } from '~/store/types.store'
import type { GroupSliceType } from './types'
import { _getGroups } from '~/utils/api'

export const groupSlice: Slice<GroupSliceType> = set => ({
  groups: [],

  addGroup(group) {
    set(state => {
      state.groups.push(group)
    })
  },

  removeGroup(groupId) {
    set(state => {
      const idx = state.groups.findIndex(g => g.id === groupId)
      if (idx === -1) {
        console.warn(`Group ${groupId} does not exist`)
        return
      }
      state.groups.splice(idx, 1)
    })
  },

  async initGroupStore() {
    const res = await _getGroups()
    set({ groups: res })
  },
})
