import { IChatListItem } from '@shared/types';

export function formatChatListItemResponse(body: any): IChatListItem {
  const {chat, message, contact} = body

  return {
    contact: contact
      ? {
          id: contact.id,
          alias: contact.alias,
        }
      : null,
    latestMsg: message
      ? {
          id: message.id,
          status: message.status,
          content: message.content,
          senderId: message.senderId,
          createdAt: message.createdAt,
        }
      : null,
    receiver: {
      id: chat.receiver_id,
      dp: chat.receiver_dp,
      bio: chat.receiver_bio,
      username: chat.receiver_username,
      globalName: chat.receiver_global_name,
    },
    chat: {
      muted: chat.muted,
      pinned: chat.pinned,
      archived: chat.archived,
    },
  }
}
