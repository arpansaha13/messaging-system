import SkeletonAvatar from './SkeletonAvatar'
import SkeletonParagraph from './SkeletonParagraph'

export default function SkeletonGroupMembersList() {
  return (
    <div className="animate-pulse space-y-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <SkeletonGroupMembersListItem key={i} />
      ))}
    </div>
  )
}

function SkeletonGroupMembersListItem() {
  return (
    <div>
      <div className="flex w-full items-center rounded px-3">
        <SkeletonAvatar size={3} />

        <div className="ml-4 w-full py-3">
          <div className="flex items-center justify-between">
            <div className="h-6 w-20 py-0.5">
              <SkeletonParagraph className="inline-block size-full" />
            </div>
          </div>
          <div className="flex h-5 justify-between">
            <div className="w-16 py-0.5">
              <SkeletonParagraph className="inline-block size-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
