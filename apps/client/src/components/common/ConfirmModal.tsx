import { DialogTitle } from '@headlessui/react'
import { Button, Modal } from '~/components/ui'

interface ConfirmModalProps {
  open: boolean
  heading: string
  submitButtonText: string
  children: React.ReactNode
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
}

export default function ConfirmModal(props: Readonly<ConfirmModalProps>) {
  const { heading, submitButtonText, open, setOpen, onSubmit, children } = props

  return (
    <Modal open={open} setOpen={setOpen}>
      <div className="mt-3 sm:mt-5">
        <DialogTitle as="h3" className="text-center text-lg font-medium leading-6 text-gray-900 dark:text-white">
          {heading}
        </DialogTitle>

        {children}

        <form className="mt-4" onSubmit={onSubmit}>
          <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
            <Button type="submit" theme="danger" className="sm:col-start-2">
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
