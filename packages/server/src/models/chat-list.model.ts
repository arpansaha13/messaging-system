export class ChatListItemModel {
  readonly userTag: string
  dp: string | null
  name: string
  time: number
  muted: boolean
  read: boolean
  latestMsg: string
}
