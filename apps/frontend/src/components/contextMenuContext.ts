export interface ContextMenuContext {
  open: Ref<boolean>
  position: Ref<{ top: number; left: number }>
  close: () => void
}

export const contextMenuSymbol = Symbol('ContextMenu')
