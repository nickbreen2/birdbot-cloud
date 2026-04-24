"use client"

import { Suspense, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import ListView from "@/components/memory/ListView"
import EntityPanel from "@/components/memory/EntityPanel"

const GraphView = dynamic(() => import("@/components/memory/GraphView"), { ssr: false })

function ViewToggle({
  view,
  onChange,
}: {
  view: "graph" | "list"
  onChange: (v: "graph" | "list") => void
}) {
  return (
    <div className="flex rounded-lg bg-panel border border-border overflow-hidden">
      {(["graph", "list"] as const).map((v) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={`px-3 py-1.5 text-xs font-semibold font-sans transition-colors ${
            view === v
              ? "bg-surface text-text-base"
              : "text-text-muted hover:text-text-dim"
          }`}
        >
          {v === "graph" ? "Graph" : "List"}
        </button>
      ))}
    </div>
  )
}

function MemoryContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const view = (searchParams.get("view") ?? "graph") as "graph" | "list"
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null)

  function setView(v: "graph" | "list") {
    router.replace(`/dashboard/memory?view=${v}`)
  }

  function handleNodeClick(id: string) {
    console.log("[Memory] node clicked:", id)
    setSelectedEntityId(id)
  }

  if (view === "list") {
    return (
      <div className="p-6 md:p-8 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-heading font-bold text-2xl text-text-base">Memory</h1>
          <ViewToggle view={view} onChange={setView} />
        </div>
        <ListView />
      </div>
    )
  }

  return (
    <div className="flex overflow-hidden" style={{ height: "100vh" }}>
      <div className="flex-1 min-w-0 flex flex-col px-6 md:px-8 pt-6 md:pt-8">
        <div className="flex items-center justify-between pb-4 flex-shrink-0">
          <h1 className="font-heading font-bold text-2xl text-text-base">Memory</h1>
          <ViewToggle view={view} onChange={setView} />
        </div>
        <GraphView onNodeClick={handleNodeClick} selectedEntityId={selectedEntityId} />
      </div>
      <EntityPanel
        entityId={selectedEntityId}
        onClose={() => setSelectedEntityId(null)}
      />
    </div>
  )
}

export default function MemoryPage() {
  return (
    <Suspense>
      <MemoryContent />
    </Suspense>
  )
}
