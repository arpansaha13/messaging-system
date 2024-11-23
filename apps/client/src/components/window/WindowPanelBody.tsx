interface WindowPanelBodyProps {
  children: React.ReactNode
}

export default function WindowPanelBody(props: Readonly<WindowPanelBodyProps>) {
  const { children } = props

  return <div className="scrollbar flex-grow overflow-y-auto p-2">{children}</div>
}
