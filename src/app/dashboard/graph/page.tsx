"use client"

export default function GraphPage() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-5 text-center">
      <div className="w-16 h-16 rounded-2xl bg-panel border border-border flex items-center justify-center">
        <img src="/node.png" alt="Graph" className="w-10 h-10 object-contain" />
      </div>
      <div>
        <h2 className="font-heading font-semibold text-lg text-text-base mb-2">Coming Soon</h2>
        <p className="text-text-dim text-sm font-sans max-w-sm leading-relaxed">
          Visualize connections between your projects, sessions, and decisions.
        </p>
      </div>
      <div className="px-4 py-2 rounded-lg bg-blue/10 border border-blue/20 text-blue-bright text-xs font-sans font-medium">
        In development
      </div>
    </div>
  )
}
