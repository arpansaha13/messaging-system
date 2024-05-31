import { classNames } from '@arpansaha13/utils'

interface SeparatorProps {
  className?: string
}
export default function Separator({ className }: Readonly<SeparatorProps>) {
  return <div className={classNames('my-1 w-full h-px bg-gray-950/10 dark:bg-gray-50/10', className)} />
}
