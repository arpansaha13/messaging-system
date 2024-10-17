import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { IGroup } from '@shared/types/client'

interface GroupSliceType {
  groups: IGroup[]
}

const initialState: GroupSliceType = {
  groups: [],
}

export const groupSlice = createSlice({
  name: 'group',
  initialState,
  reducers: {
    addGroup: (state, action: PayloadAction<IGroup>) => {
      state.groups.push(action.payload)
    },
    removeGroup: (state, action: PayloadAction<IGroup['id']>) => {
      const idx = state.groups.findIndex(g => g.id === action.payload)
      if (idx === -1) {
        console.warn(`Group ${action.payload} does not exist`)
        return
      }
      state.groups.splice(idx, 1)
    },
  },
})

export const { addGroup, removeGroup } = groupSlice.actions
