import { useEffect, useState, type RefObject } from 'react'

export function useOverflow(ref: RefObject<HTMLElement>) {
  const [isOverflowingX, setIsOverflowingX] = useState(false)
  const [isOverflowingY, setIsOverflowingY] = useState(false)

  useEffect(() => {
    const currentRef = ref.current

    const observer = new ResizeObserver(entries => {
      for (let entry of entries) {
        const isOverflowX = entry.target.scrollWidth > entry.target.clientWidth
        const isOverflowY = entry.target.scrollHeight > entry.target.clientHeight

        setIsOverflowingX(isOverflowX)
        setIsOverflowingY(isOverflowY)
      }
    })

    if (currentRef) {
      observer.observe(currentRef)
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, [ref])

  return { isOverflowingX, isOverflowingY }
}
