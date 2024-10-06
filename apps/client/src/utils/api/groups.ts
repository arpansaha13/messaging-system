import _fetch from './_fetch'
import type { IGroup } from '@shared/types/client'

interface IPostCreateGroupBody {
  name: string
}

export function _getGroups(): Promise<IGroup[]> {
  return _fetch('groups')
}

export function _postGroups(body: IPostCreateGroupBody): Promise<IGroup> {
  return _fetch('groups', { method: 'POST', body })
}

export function _getChannelsOfGroup(groupId: IGroup['id']) {
  return _fetch(`groups/${groupId}/channels`)
}
