import _fetch from '~/utils/api/_fetch'
import type { IMessage } from '@shared/types'
import type { IUser } from '@shared/types/client'

export function _getMessages(receiverId: IUser['id']): Promise<IMessage[]> {
  return _fetch(`messages/${receiverId}`)
}
