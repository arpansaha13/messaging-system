import { shallow } from 'zustand/shallow'
import SidebarHeader from './SidebarHeader'
import Profile from '~/components/Profile'
import Settings from '~/components/Settings'
import AddContact from '~/components/ContactList/AddContact'
import Archived from '~/components/Convo/Archived'
import ContactList from '~/components/ContactList'
// import SidebarSearchBar from './SidebarSearchBar'
import UnarchivedRooms from '~/components/Convo/Unarchived'
import type { SlideOverStateType } from '~/store/slices/useSlideOverState'
import { useStore } from '~/store'

function getSlideOverContent(componentName: SlideOverStateType['slideOverState']['componentName']) {
  switch (componentName) {
    case 'ContactList':
      return <ContactList />
    case 'Archived':
      return <Archived />
    case 'Profile':
      return <Profile />
    case 'AddContact':
      return <AddContact />
    case 'Settings':
      return <Settings />
    case 'Unarchived':
      return <UnarchivedRooms />
  }
}

const Sidebar = () => {
  const [slideOverState] = useStore(state => [state.slideOverState], shallow)

  return (
    <div className="h-full space-y-2">
      <SidebarHeader />
      {/* <SidebarSearchBar /> */}
      {getSlideOverContent(slideOverState.componentName)}
    </div>
  )
}

export default Sidebar
