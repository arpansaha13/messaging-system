// Components
import StackedListItem from './StackedListItem'
// Utils
import classNames from '../../utils/classNames'
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

export default function StackedList({
  stackedList,
  active,
  handleClick,
}: StackedListProps) {
  return (
    <ul role="list">
      {stackedList.map(listItem => (
        <li key={listItem.userId}>
          <button
            className={classNames(
              'px-3 w-full text-left flex items-center relative',
              listItem.userId === active
                ? 'bg-gray-700/90'
                : 'hover:bg-gray-600/40',
            )}
            onClick={
              typeof handleClick === 'function'
                ? () => handleClick(listItem)
                : undefined
            }
          >
            <span className="absolute inset-0" />
            <StackedListItem
              name={listItem.name}
              dp={listItem.dp}
              time={listItem.time}
              text={listItem.text}
            />
          </button>
        </li>
      ))}
    </ul>
  )
}
