import { UserGroupIcon } from '@heroicons/react/24/solid'

export default function SkeletonNavbarGroupList() {
  return (
    <ul className="animate-pulse space-y-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="mx-auto flex size-10 items-center justify-center rounded">
          <UserGroupIcon className="size-6 flex-shrink-0 text-gray-500" />
        </div>
      ))}
    </ul>
  )
}
