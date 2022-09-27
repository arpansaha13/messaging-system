import Message from './Message'

import type { MessageType } from '../../types'

export default function ChatArea() {
  const messages: MessageType[] = [
    {
      msg: 'My message',
      myMsg: true,
      time: '3:29 AM',
      status: 'delivered',
    },
    {
      msg: 'Other message',
      myMsg: false,
      time: '3:29 AM',
      status: 'read',
    },
    {
      msg: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
      myMsg: true,
      time: '3:29 AM',
      status: 'read',
    }
  ]
  return (
    <div className='h-full flex flex-col justify-end'>
      {
        messages.map((message, i) => {
          return (
            <Message key={ i } message={ message } />
          )
        })
      }
    </div>
  )
}
