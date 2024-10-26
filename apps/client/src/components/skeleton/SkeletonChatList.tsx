import SkeletonAvatar from './SkeletonAvatar'
import SkeletonParagraph from './SkeletonParagraph'

export default function SkeletonChatList() {
  return (
    <div className="animate-pulse space-y-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <SkeletonChatListItem key={i} />
      ))}
    </div>
  )
}

function SkeletonChatListItem() {
  return (
    <div>
      <div className="flex w-full items-center rounded px-3">
        <SkeletonAvatar size={3} />

        <div className="ml-4 w-full py-3">
          <div className="flex items-center justify-between">
            <div className="h-6 w-20 py-0.5">
              <SkeletonParagraph className="inline-block size-full" />
            </div>
            <div className="h-4 w-12">
              <SkeletonParagraph className="inline-block size-full" />
            </div>
          </div>
          <div className="flex h-5 justify-between">
            <div className="w-4/5 py-0.5">
              <SkeletonParagraph className="inline-block size-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
