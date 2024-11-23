interface WindowBodyProps {
  children: React.ReactNode
}

export default function WindowBody(props: Readonly<WindowBodyProps>) {
  const { children } = props

  return (
    <section className="h-full flex-grow overflow-hidden rounded bg-gray-100 shadow-md dark:bg-gray-800">
      {children}
    </section>
  )
}
