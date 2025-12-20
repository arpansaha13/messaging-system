type KeyFactory<T extends string | number> = (id: T) => string

function buildKey(namespace: string, id?: string | number) {
  return id !== undefined ? `${namespace}:${id}` : namespace
}

export const asyncKeys = {
  authUser: 'auth:user',
  chatList: 'chats:list',
  contacts: 'contacts:list',
  invites: 'invites:list',
  notification: 'app:notification',
  groups: 'groups:list',
  group: ((id: number) => buildKey('group', id)) as KeyFactory<number>,
  groupChannels: ((groupId: number) => buildKey('group:channels', groupId)) as KeyFactory<number>,
  groupMembers: ((groupId: number) => buildKey('group:members', groupId)) as KeyFactory<number>,
  groupInvite: ((groupId: number) => buildKey('group:invite', groupId)) as KeyFactory<number>,
  channel: ((channelId: number) => buildKey('channel', channelId)) as KeyFactory<number>,
  inviteByHash: ((hash: string) => buildKey('invite', hash)) as KeyFactory<string>,
  user: ((userId: number) => buildKey('user', userId)) as KeyFactory<number>,
  messages: ((receiverId: number) => buildKey('messages', receiverId)) as KeyFactory<number>,
  groupMessages: ((channelId: number) => buildKey('group:messages', channelId)) as KeyFactory<number>,
  searchUsers: ((query: string) => buildKey('search:users', query)) as KeyFactory<string>,
  searchContacts: ((query: string) => buildKey('search:contacts', query)) as KeyFactory<string>,
}
