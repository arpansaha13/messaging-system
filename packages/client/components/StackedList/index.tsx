// Components
import StackedListItem from './StackedListItem'
// Types
import type { StackedListItemProps } from './StackedListItem'

interface StackedListItemType extends StackedListItemProps {
  userId: number
}
interface StackedListProps {
  stackedList: StackedListItemType[]
  active?: number | null
  handleClick?: (stackedListItem: any) => void
}

export default function StackedList({ stackedList, active, handleClick }: StackedListProps) {
  return (
    <ul role="list">
      {stackedList.map(listItem => (
        <StackedListItem
          key={listItem.userId}
          userId={listItem.userId}
          name={listItem.name}
          dp={listItem.dp}
          time={listItem.time}
          text={listItem.text}
          active={active}
          onClick={typeof handleClick === 'function' ? () => handleClick(listItem) : undefined}
        />
      ))}
    </ul>
  )
}
