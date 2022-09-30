import { Injectable } from '@nestjs/common'
// Types
import type { MessageType } from 'src/types'

@Injectable()
export class ChatsService {
  /**
   * Get the chat between two users.
   * @param userTag the user tag of the user with whom the chat is to be opened.
   */
  getChat(userTag: string): MessageType[] {
    // Fake data for now
    switch (userTag) {
      case 'first':
        return [
          {
            msg: 'First chat',
            myMsg: true,
            time: 1664452378595,
            status: 'delivered',
          },
          {
            msg: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
            myMsg: false,
            time: 1664452388595,
            status: 'sent',
          },
          {
            msg: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
            myMsg: true,
            time: 1664552378595,
            status: 'read',
          },
        ]
      case 'second':
        return [
          {
            msg: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
            myMsg: true,
            time: 1664452378595,
            status: 'delivered',
          },
          {
            msg: 'Second chat',
            myMsg: false,
            time: 1664452388595,
            status: 'sent',
          },
          {
            msg: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
            myMsg: true,
            time: 1664552378595,
            status: 'read',
          },
        ]
      case 'third':
        return [
          {
            msg: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
            myMsg: true,
            time: 1664452378595,
            status: 'delivered',
          },
          {
            msg: 'Third chat',
            myMsg: false,
            time: 1664452388595,
            status: 'sent',
          },
          {
            msg: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
            myMsg: true,
            time: 1664552378595,
            status: 'read',
          },
        ]
      default:
        return []
    }
  }
}
