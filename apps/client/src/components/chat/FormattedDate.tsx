import { differenceInCalendarDays, format } from 'date-fns'

interface FormattedDateProps {
  dateString: string
}

export default function FormattedDate(props: Readonly<FormattedDateProps>) {
  const { dateString } = props
  const formattedTime = format(dateString, 'hh:mm a')
  const formattedDate = (() => {
    const diff = differenceInCalendarDays(new Date(), new Date(dateString))

    if (diff < 1) return 'Today at'
    if (diff === 1) return 'Yesterday at'
    return format(dateString, 'dd/MM/yy')
  })()

  return (
    <span className="text-xs text-gray-800 dark:text-gray-400">
      <time>
        {formattedDate} {formattedTime}
      </time>
    </span>
  )
}
