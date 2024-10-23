import { DialogTitle } from '@headlessui/react'
import { useState } from 'react'
import { Button, Modal } from '~/components/ui'

interface FormModalProps {
  open: boolean
  heading: string
  submitButtonText: string
  children: React.ReactNode
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
  action: (e: React.FormEvent<HTMLFormElement>) => void | Promise<void>
}

export default function FormModal(props: Readonly<FormModalProps>) {
  const { heading, submitButtonText, open, setOpen, action, children } = props

  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    await action(e)
    setLoading(false)
  }

  return (
    <Modal open={open} setOpen={setOpen}>
      <div className="mt-3 sm:mt-5">
        <DialogTitle as="h3" className="text-center text-lg font-medium leading-6 text-gray-900 dark:text-white">
          {heading}
        </DialogTitle>

        <form className="mt-4" onSubmit={onSubmit}>
          {children}

          <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
            <Button type="submit" loading={loading} className="sm:col-start-2">
              {submitButtonText}
            </Button>

            <Button theme="secondary" className="mt-3 sm:col-start-1 sm:mt-0" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  )
}
