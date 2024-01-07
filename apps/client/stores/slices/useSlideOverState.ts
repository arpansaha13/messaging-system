import type { Slice } from '~/stores/types.store'

type SlideOverComponentNames = 'ContactList' | 'Archived' | 'StarredMessages' | 'Settings' | 'Profile' | 'AddContact'

export interface SlideOverStateType {
  slideOverState: {
    open: boolean
    /** Panel title displayed on top of slide over panel. */
    title: string
    /** The name of the component to be rendered in the slide-over. */
    componentName: SlideOverComponentNames
  }
  setSlideOverState: (newState: Partial<SlideOverStateType['slideOverState']>) => void

  /** Toggle the show/hide of the slide-over. */
  toggleSlideOver: (bool?: boolean) => void
}

/** The global notification component is used only in the auth layout (for now). The global notification will show or hide with content depending on the state of this store. */
export const useSlideOverState: Slice<SlideOverStateType> = set => ({
  slideOverState: {
    open: false,
    title: 'New Chat',
    componentName: 'ContactList',
  },
  toggleSlideOver(bool) {
    set((state: SlideOverStateType) => {
      if (typeof bool !== 'undefined') {
        state.slideOverState.open = bool
      } else {
        state.slideOverState.open = !state.slideOverState.open
      }
    })
  },
  setSlideOverState(newState) {
    set((state: SlideOverStateType) => {
      state.slideOverState = {
        ...state.slideOverState,
        ...newState,
      }
    })
  },
})
