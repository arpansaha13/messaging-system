import type { NextPage } from 'next'

import ChatView from '../components/ChatView'
import ChatSidebar from '../components/ChatSidebar'

const Home: NextPage = () => {
  const chatSelected = true

  return (
    <main className='grid grid-cols-10 h-full'>
      <section className='col-span-3 h-full border-r border-gray-600/70'>
        <ChatSidebar />
      </section>

      <section className='col-span-7 h-full bg-gray-800'>
        {
          chatSelected && <ChatView />
        }
      </section>
    </main>
  )
}

export default Home
