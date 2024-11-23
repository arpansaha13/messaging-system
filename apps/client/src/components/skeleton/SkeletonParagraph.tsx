import { classNames } from '@arpansaha13/utils'

interface SkeletonParagraphProps {
  className: string
}

export default function SkeletonParagraph(props: Readonly<SkeletonParagraphProps>) {
  const { className } = props

  // Do not use `animate-pulse` here
  return <div className={classNames(className, 'rounded-sm bg-gray-300 dark:bg-gray-500')} />
}
