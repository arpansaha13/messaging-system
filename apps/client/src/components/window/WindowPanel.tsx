import { classNames } from '@arpansaha13/utils'

interface WindowPanelProps {
  children: React.ReactNode
  className?: string
}

export default function WindowPanel(props: Readonly<WindowPanelProps>) {
  const { children, className } = props

  return (
    <section
      className={classNames(
        'flex h-full w-[22rem] flex-shrink-0 flex-col overflow-hidden rounded bg-gray-100 shadow-md dark:bg-gray-900',
        className,
      )}
    >
      {children}
    </section>
  )
}
