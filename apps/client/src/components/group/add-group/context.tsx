import { createContext, useContext, useMemo, useState } from 'react'

interface IAddGroupContext {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
}

interface IAddGroupProviderProps {
  children: React.ReactNode
}

const AddGroupContext = createContext<IAddGroupContext | null>(null)

export default function AddGroupProvider(props: Readonly<IAddGroupProviderProps>) {
  const { children } = props

  const [open, setOpen] = useState(false)
  const value = useMemo(() => ({ open, setOpen }), [open, setOpen])

  return <AddGroupContext.Provider value={value}>{children}</AddGroupContext.Provider>
}

export function useAddGroupContext() {
  return useContext(AddGroupContext)
}
