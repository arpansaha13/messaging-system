export default function Loading() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="flex h-28 space-x-8 relative">
        <img src="/nextjs-icon.svg" alt="nextjs-logo" className="animate-pulse animation-delay-300" />
        <img src="/reactjs-icon.svg" alt="reactjs-logo" className="animate-pulse animation-delay-75" />
        <img src="/nestjs-icon.svg" alt="nestjs-logo" className="animate-pulse" />
        <img src="/postgresql-icon.svg" alt="postgresql-logo" className="animate-pulse animation-delay-500" />
      </div>
    </div>
  )
}
