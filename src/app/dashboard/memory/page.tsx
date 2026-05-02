"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import dynamic from "next/dynamic"
import { Search } from "lucide-react"
import ListView from "@/components/memory/ListView"
import EntityPanel from "@/components/memory/EntityPanel"
import type { GraphNodeInfo, GraphEdgeInfo } from "@/components/memory/GraphView"

const GraphView = dynamic(() => import("@/components/memory/GraphView"), { ssr: false })

function SearchPill({ query, setQuery }: { query: string; setQuery: (q: string) => void }) {
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const isExpanded = focused || !!query

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [])

  return (
    <div
      className="relative flex items-center rounded-full bg-panel"
      style={{
        width: isExpanded ? "22rem" : "14rem",
        border: `1px solid ${isExpanded ? "rgba(37,99,235,0.38)" : "rgba(255,255,255,0.07)"}`,
        boxShadow: isExpanded
          ? "0 0 0 3px rgba(37,99,235,0.07), 0 2px 12px rgba(0,0,0,0.35)"
          : "0 1px 4px rgba(0,0,0,0.25)",
        transition: "width 220ms ease, border-color 180ms ease, box-shadow 180ms ease",
      }}
    >
      <Search
        size={13}
        className="absolute left-3.5 pointer-events-none transition-colors duration-200"
        style={{ color: isExpanded ? "rgba(96,165,250,0.75)" : "rgba(255,255,255,0.25)" }}
      />
      <input
        ref={inputRef}
        type="text"
        placeholder="Search memory…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="w-full pl-8 pr-11 py-2 text-sm font-sans bg-transparent text-text-base placeholder:text-text-muted focus:outline-none"
        style={{ caretColor: "rgba(96,165,250,0.9)" }}
      />
      {!isExpanded && (
        <div className="absolute right-2.5 pointer-events-none">
          <kbd
            className="flex items-center px-1.5 py-[3px] rounded text-[10px] font-mono leading-none tracking-wide"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.09)",
              color: "rgba(255,255,255,0.28)",
            }}
          >
            ⌘K
          </kbd>
        </div>
      )}
    </div>
  )
}

function ViewToggle({
  view,
  onChange,
}: {
  view: "graph" | "list"
  onChange: (v: "graph" | "list") => void
}) {
  return (
    <div className="flex rounded-lg bg-panel border border-border overflow-hidden">
      {(["list", "graph"] as const).map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={`px-3 py-1.5 text-xs font-semibold font-sans transition-colors ${
            view === v
              ? "bg-surface text-text-base"
              : "text-text-muted hover:text-text-dim"
          }`}
        >
          {v === "list" ? "List" : "Graph"}
        </button>
      ))}
    </div>
  )
}

function MemoryContent() {
  const [view, setView] = useState<"graph" | "list">("list")
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [graphNodes, setGraphNodes] = useState<GraphNodeInfo[]>([])
  const [graphEdges, setGraphEdges] = useState<GraphEdgeInfo[]>([])

  const handleDataLoaded = useCallback((nodes: GraphNodeInfo[], edges: GraphEdgeInfo[]) => {
    setGraphNodes(nodes)
    setGraphEdges(edges)
  }, [])

  const connections = useMemo(() => {
    if (!selectedEntityId) return []
    const neighborIds = new Set<string>()
    graphEdges.forEach((e) => {
      if (e.fromId === selectedEntityId) neighborIds.add(e.toId)
      if (e.toId === selectedEntityId) neighborIds.add(e.fromId)
    })
    return graphNodes.filter((n) => neighborIds.has(n.id))
  }, [selectedEntityId, graphNodes, graphEdges])

  return (
    <div className="flex overflow-hidden" style={{ height: "100vh" }}>
      <div className="flex-1 min-w-0 flex flex-col px-6 md:px-8 pt-6 md:pt-8">
        <div className="flex items-center justify-between pb-4 flex-shrink-0">
          <SearchPill query={query} setQuery={setQuery} />
          <ViewToggle view={view} onChange={setView} />
        </div>
        {view === "list" ? (
          <div className="flex-1 overflow-y-auto">
            <ListView query={query} />
          </div>
        ) : (
          <div className="flex-1 min-h-0">
            <GraphView onNodeClick={setSelectedEntityId} selectedEntityId={selectedEntityId} query={query} onDataLoaded={handleDataLoaded} />
          </div>
        )}
      </div>
      {view === "graph" && (
        <EntityPanel
          entityId={selectedEntityId}
          onClose={() => setSelectedEntityId(null)}
          connections={connections}
          onConnectionClick={setSelectedEntityId}
        />
      )}
    </div>
  )
}

export default function MemoryPage() {
  return <MemoryContent />
}
