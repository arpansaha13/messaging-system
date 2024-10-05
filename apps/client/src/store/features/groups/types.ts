import type { IGroup } from '@shared/types/client'

export interface GroupSliceType {
  groups: IGroup[]

  initGroupStore: () => Promise<void>

  addGroup: (group: IGroup) => void

  removeGroup: (groupId: number) => void
}
