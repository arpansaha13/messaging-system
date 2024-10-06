import type { IChannel, IGroup } from '@shared/types/client'

export interface ChannelSliceType {
  channelsMap: Map<IGroup['id'], IChannel[]>

  insertChannels: (groupId: IGroup['id'], channels: IChannel[]) => void
}
