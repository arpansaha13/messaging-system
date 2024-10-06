interface WindowPanelBodyProps {
  children: React.ReactNode
}

export default function WindowPanelBody(props: Readonly<WindowPanelBodyProps>) {
  const { children } = props

  return <div className="p-2">{children}</div>
}
