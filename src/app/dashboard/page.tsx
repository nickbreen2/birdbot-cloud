export default function DashboardPage() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 text-center px-4">
      <span className="egg-shake text-8xl select-none" role="img" aria-label="egg">
        🥚
      </span>
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-bold text-text-base">
          Your Birdbot is Incubating
        </h1>
        <p className="text-text-dim text-base">
          We&apos;ll notify you when it&apos;s hatched.
        </p>
      </div>
    </div>
  )
}
