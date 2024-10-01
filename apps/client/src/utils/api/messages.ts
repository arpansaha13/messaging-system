import _fetch from './_fetch'
import type { IMessage } from '@shared/types'

export function _getMessages(receiverId: number): Promise<IMessage[]> {
  return _fetch(`messages/${receiverId}`)
}
