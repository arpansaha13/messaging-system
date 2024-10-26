import SkeletonAvatar from './SkeletonAvatar'
import SkeletonParagraph from './SkeletonParagraph'

export default function SkeletonContactList() {
  return (
    <div className="my-2 animate-pulse space-y-1">
      <SkeletonContactFirstLetter />

      {Array.from({ length: 2 }).map((_, i) => (
        <SkeletonContactListItem key={i} />
      ))}

      <SkeletonContactFirstLetter />

      {Array.from({ length: 1 }).map((_, i) => (
        <SkeletonContactListItem key={i} />
      ))}
    </div>
  )
}

function SkeletonContactFirstLetter() {
  return (
    <div className="mx-3 my-2 flex size-12 items-center justify-center font-medium">
      <div className="h-6">
        <SkeletonParagraph className="size-[2ch]" />
      </div>
    </div>
  )
}

function SkeletonContactListItem() {
  return (
    <div>
      <div className="flex w-full items-center rounded px-3">
        <SkeletonAvatar size={3} />

        <div className="ml-4 w-full py-3">
          <div className="flex h-6 justify-between">
            <div className="w-20 py-0.5">
              <SkeletonParagraph className="inline-block size-full" />
            </div>
          </div>
          <div className="flex h-5 justify-between">
            <div className="w-24 py-0.5">
              <SkeletonParagraph className="inline-block size-full" />
            </div>
          </div>
          <div className="mt-1 flex h-5 justify-between">
            <div className="flex w-3/4 items-center space-x-1 py-0.5">
              <SkeletonParagraph className="inline-block size-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
