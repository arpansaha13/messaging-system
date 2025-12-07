import type { IUser } from '~/types'

interface GlobalNameProps {
  name: IUser['globalName']
}

export default function GlobalName(props: Readonly<GlobalNameProps>) {
  return <span className="italic">~{props.name}</span>
}
