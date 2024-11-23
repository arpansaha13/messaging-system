interface WindowProps {
  children: React.ReactNode
}

export default function Window(props: Readonly<WindowProps>) {
  const { children } = props

  return <div className="flex h-full gap-2 p-2">{children}</div>
}
