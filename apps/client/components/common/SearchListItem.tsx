import Avatar from './Avatar'

interface SearchListItemProps {
  image: string | null
  title: string
  subtitle: string
  text: string
  onClick: () => void
}

export default function SearchListItem({ image, title, subtitle, text, onClick }: Readonly<SearchListItemProps>) {
  return (
    <li>
      <button
        className="px-3 w-full text-left hover:bg-gray-200/60 dark:hover:bg-gray-600/40 flex items-center"
        onClick={onClick}
      >
        <Avatar src={image} />

        <div className="ml-4 py-3 w-full border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between">
            <p className="text-base text-black dark:text-gray-50">{title}</p>
          </div>
          <div className="flex justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">{subtitle}</p>
          </div>
          <div className="mt-1 flex justify-between">
            <p className="flex items-center text-sm text-gray-500 dark:text-gray-400 space-x-1 line-clamp-1">{text}</p>
          </div>
        </div>
      </button>
    </li>
  )
}
