import { Avatar } from '~/components/common'

interface ContactAndSearchListItemTemplateProps {
  text: string
  image: string | null
  title: string | React.ReactNode
  subtitle: string | React.ReactNode
}

export default function ContactAndSearchListItemTemplate(props: Readonly<ContactAndSearchListItemTemplateProps>) {
  const { text, subtitle, image, title } = props

  return (
    <>
      <Avatar src={image} size={3} />

      <div className="ml-4 w-full py-3">
        <div className="flex justify-between">
          <p className="text-base text-black dark:text-gray-50">{title}</p>
        </div>
        <div className="flex justify-between">
          <p className="text-sm italic text-gray-500 dark:text-gray-400">{subtitle}</p>
        </div>
        <div className="mt-1 flex justify-between">
          {/* TODO: Make a slot for icons */}
          <p className="line-clamp-1 flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">{text}</p>
        </div>
      </div>
    </>
  )
}
