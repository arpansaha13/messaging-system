import { Injectable } from '@nestjs/common'
// Models
import type { MessageModel } from 'src/models/message.model'
// Enum
import { MessageStatus } from 'src/models/message.model'

@Injectable()
export class ChatsService {
  /**
   * Get the chat between two users.
   * @param userTag the user tag of the user with whom the chat is to be opened.
   */
  getChatbyUserTag(userTag: string): MessageModel[] {
    // Fake data for now
    switch (userTag) {
      case 'first':
        return [
          {
            msg: 'First chat',
            myMsg: true,
            time: 1664452378595,
            status: MessageStatus.DELIVERED,
          },
          {
            msg: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
            myMsg: false,
            time: 1664452388595,
            status: MessageStatus.SENT,
          },
          {
            msg: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
            myMsg: true,
            time: 1664552378595,
            status: MessageStatus.READ,
          },
        ]
      case 'second':
        return [
          {
            msg: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
            myMsg: true,
            time: 1664452378595,
            status: MessageStatus.DELIVERED,
          },
          {
            msg: 'Second chat',
            myMsg: false,
            time: 1664452388595,
            status: MessageStatus.SENT,
          },
          {
            msg: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
            myMsg: true,
            time: 1664552378595,
            status: MessageStatus.READ,
          },
        ]
      case 'third':
        return [
          {
            msg: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
            myMsg: true,
            time: 1664452378595,
            status: MessageStatus.DELIVERED,
          },
          {
            msg: 'Third chat',
            myMsg: false,
            time: 1664452388595,
            status: MessageStatus.SENT,
          },
          {
            msg: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
            myMsg: true,
            time: 1664552378595,
            status: MessageStatus.READ,
          },
        ]
      default:
        return []
    }
  }
}
