interface ButtonProps {
  icon: any
  text: string
  onClick: () => void
}

export default function Button(props: Readonly<ButtonProps>) {
  const { text, icon: Icon, onClick } = props

  return (
    <button
      type="button"
      className="focus:ring-brand-500 flex w-full items-center gap-3 rounded px-4 py-3 text-left text-sm transition-colors hover:bg-gray-200 focus:outline-none focus:ring-2 dark:hover:bg-gray-800"
      onClick={onClick}
    >
      <Icon className="size-5 flex-shrink-0 text-gray-700 dark:text-gray-300" />
      <span className="inline-block">{text}</span>
    </button>
  )
}
