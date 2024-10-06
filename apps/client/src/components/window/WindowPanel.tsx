import { classNames } from '@arpansaha13/utils'

interface WindowPanelProps {
  children: React.ReactNode
  className: string
}

export default function WindowPanel(props: Readonly<WindowPanelProps>) {
  const { children, className } = props

  return (
    <section
      className={classNames(
        'flex h-full flex-shrink-0 flex-col space-y-2 overflow-hidden rounded bg-gray-100 p-2 shadow-md dark:bg-gray-900',
        className,
      )}
    >
      <div className="scrollbar flex-grow overflow-y-auto">{children}</div>
    </section>
  )
}
