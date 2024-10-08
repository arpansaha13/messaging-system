import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { AppThunk } from '~/store/store'
import { _getGroups } from '~/utils/api'
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
    setGroups: (state, action: PayloadAction<IGroup[]>) => {
      state.groups = action.payload
    },
  },
  selectors: {
    selectGroups: slice => slice.groups,
  },
})

export const { addGroup, removeGroup, setGroups } = groupSlice.actions
export const { selectGroups } = groupSlice.selectors

export const initGroupStore = (): AppThunk => async dispatch => {
  const res = await _getGroups()
  dispatch(setGroups(res))
}
