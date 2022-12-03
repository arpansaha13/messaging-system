import create from 'zustand'

type SlideOverComponentNames = 'ContactList' | 'Archived' | 'StarredMessages' | 'Settings' | 'Profile'

interface SlideOverStateType {
  open: boolean

  /** Toggle the show/hide of the slide-over. */
  toggle: (bool?: boolean) => void

  /** Panel title displayed on top of slide over panel. */
  title: string

  /** Set the title of slide-over */
  setTitle: (newTitle: string) => void

  /** The name of the component to be rendered in the slide-over. */
  componentName: SlideOverComponentNames

  /** Set the name of the component to be rendered. */
  setComponentName: (name: SlideOverComponentNames) => void
}

/** The global notification component is used only in the auth layout (for now). The global notification will show or hide with content depending on the state of this store. */
export const useSlideOverState = create<SlideOverStateType>()(set => ({
  open: false,
  toggle(bool) {
    if (typeof bool !== 'undefined') {
      set({ open: bool })
    } else {
      set(state => ({ open: !state.open }))
    }
  },
  title: '',
  setTitle(newTitle) {
    set({ title: newTitle })
  },
  componentName: 'ContactList',
  setComponentName(name) {
    set({ componentName: name })
  },
}))
