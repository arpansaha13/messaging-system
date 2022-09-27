import { memo } from 'react'
import type { ReactNode } from 'react'
import styles from './LinkCard.module.css'

interface LinkCardProps{
  href: string
  children: ReactNode
}

const LinkCard = ({ href, children }: LinkCardProps) => {
  return (
    <a href={href} className={`${styles.card} m-4 p-6 text-left rounded-xl transition-colors max-w-xs border border-[#222] dark:border-[#eaeaea] text-inherit`}>
      { children }
    </a>
  )
}

export default memo(LinkCard)
