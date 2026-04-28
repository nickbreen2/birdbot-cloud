"use client"

import { useEffect, useRef, useState } from "react"
import * as d3 from "d3"

type EntityTypeName = "file" | "concept" | "date" | "decision" | "task" | "technology" | "person" | "goal"

interface NodeDatum extends d3.SimulationNodeDatum {
  id: string
  name: string
  type: EntityTypeName
  description: string | null
  mentionCount: number
}

interface EdgeDatum extends d3.SimulationLinkDatum<NodeDatum> {
  id: string
  fromId: string
  toId: string
  label: string
}

const NODE_COLORS: Record<EntityTypeName, string> = {
  goal:       "#d97706",
  task:       "#3b82f6",
  concept:    "#71717a",
  date:       "#d946ef",
  technology: "#8b5cf6",
  person:     "#f43f5e",
  decision:   "#f97316",
  file:       "#10b981",
}

function nodeRadius(d: NodeDatum): number {
  return 6 + Math.sqrt(Math.max(1, d.mentionCount)) * 4
}

interface GraphApiResponse {
  nodes: { id: string; name: string; type: EntityTypeName; description: string | null; mentionCount: number }[]
  edges: { id: string; fromId: string; toId: string; label: string }[]
}

interface GraphViewProps {
  onNodeClick: (id: string) => void
  selectedEntityId: string | null
}

export default function GraphView({ onNodeClick, selectedEntityId }: GraphViewProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const simulationRef = useRef<d3.Simulation<NodeDatum, EdgeDatum> | null>(null)
  const onNodeClickRef = useRef(onNodeClick)
  const selectedIdRef = useRef(selectedEntityId)
  const nodeSelRef = useRef<d3.Selection<SVGGElement, NodeDatum, SVGGElement, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [graphData, setGraphData] = useState<{ nodes: NodeDatum[]; edges: EdgeDatum[] } | null>(null)
  const [dismissed, setDismissed] = useState(() =>
    localStorage.getItem("birdbot-graph-overlay-dismissed") === "true"
  )

  useEffect(() => {
    onNodeClickRef.current = onNodeClick
  }, [onNodeClick])

  // Sync selected ref and update ring without restarting simulation
  useEffect(() => {
    selectedIdRef.current = selectedEntityId
    const nodeSel = nodeSelRef.current
    if (!nodeSel) return
    nodeSel.select("circle")
      .attr("stroke-width", (n) => n.id === selectedEntityId ? 4 : 2)
      .attr("stroke-opacity", (n) => n.id === selectedEntityId ? 1.0 : 0.35)
  }, [selectedEntityId])

  useEffect(() => {
    fetch("/api/memory/graph")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load graph")
        return r.json() as Promise<GraphApiResponse>
      })
      .then(({ nodes, edges }) => {
        const nodeIds = new Set(nodes.map((n) => n.id))
        const validEdges: EdgeDatum[] = edges
          .filter((e) => nodeIds.has(e.fromId) && nodeIds.has(e.toId))
          .map((e) => ({ ...e, source: e.fromId, target: e.toId }))
        setGraphData({ nodes, edges: validEdges })
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Something went wrong"))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!graphData || !svgRef.current) return

    const svg = d3.select(svgRef.current)
    const { width, height } = svgRef.current.getBoundingClientRect()
    const w = width || 800
    const h = height || 500

    if (simulationRef.current) simulationRef.current.stop()
    svg.selectAll("*").remove()

    if (graphData.nodes.length === 0) return

    const nodes: NodeDatum[] = graphData.nodes.map((n) => ({ ...n }))
    const edges: EdgeDatum[] = graphData.edges.map((e) => ({ ...e }))

    const linkSel = svg
      .append("g")
      .selectAll("line")
      .data(edges)
      .join("line")
      .attr("stroke", "#3f3f46")
      .attr("stroke-width", 1.5)
      .attr("stroke-opacity", 0.5)

    const nodeSel = svg
      .append("g")
      .selectAll<SVGGElement, NodeDatum>("g")
      .data(nodes)
      .join("g")
      .style("cursor", "pointer")

    nodeSelRef.current = nodeSel

    nodeSel
      .append("circle")
      .attr("r", nodeRadius)
      .attr("fill", (d) => NODE_COLORS[d.type])
      .attr("fill-opacity", 0.85)
      .attr("stroke", (d) => NODE_COLORS[d.type])
      .attr("stroke-width", 2)
      .attr("stroke-opacity", 0.35)

    nodeSel
      .append("text")
      .attr("dy", (d) => nodeRadius(d) + 13)
      .attr("text-anchor", "middle")
      .attr("fill", "#a1a1aa")
      .attr("font-size", "11px")
      .attr("font-family", "ui-sans-serif, system-ui, sans-serif")
      .text((d) => d.name)

    function applyBaseStyles() {
      const selId = selectedIdRef.current
      linkSel.attr("stroke-opacity", 0.5)
      nodeSel.select("circle")
        .attr("fill-opacity", 0.85)
        .attr("r", nodeRadius)
        .attr("stroke-opacity", (n) => n.id === selId ? 1.0 : 0.35)
        .attr("stroke-width", (n) => n.id === selId ? 4 : 2)
      nodeSel.select("text").attr("fill", "#a1a1aa")
    }

    nodeSel.on("mouseover", (_, d) => {
      const selId = selectedIdRef.current
      const neighbors = new Set<string>()
      edges.forEach((e) => {
        const src = (e.source as NodeDatum).id
        const tgt = (e.target as NodeDatum).id
        if (src === d.id) neighbors.add(tgt)
        if (tgt === d.id) neighbors.add(src)
      })

      linkSel.attr("stroke-opacity", (e) => {
        const src = (e.source as NodeDatum).id
        const tgt = (e.target as NodeDatum).id
        return src === d.id || tgt === d.id ? 0.7 : 0.05
      })

      nodeSel.select("circle")
        .attr("fill-opacity", (n) => {
          if (n.id === d.id) return 1.0
          if (neighbors.has(n.id)) return 0.85
          return 0.12
        })
        .attr("r", (n) => (n.id === d.id ? nodeRadius(n) + 2 : nodeRadius(n)))
        .attr("stroke-opacity", (n) => {
          if (n.id === d.id) return 1.0
          if (n.id === selId) return 0.8  // selected ring stays visible while others dim
          return neighbors.has(n.id) ? 0.35 : 0.05
        })
        .attr("stroke-width", (n) => {
          if (n.id === d.id) return n.id === selId ? 5 : 3
          return n.id === selId ? 4 : 2
        })

      nodeSel.select("text")
        .attr("fill", (n) =>
          n.id === d.id ? "#e4e4e7" : neighbors.has(n.id) ? "#a1a1aa" : "#3f3f46"
        )
    })

    nodeSel.on("mouseout", applyBaseStyles)

    const drag = d3.drag<SVGGElement, NodeDatum>()
      .on("start", (event, d) => {
        if (!event.active) simulationRef.current?.alphaTarget(0.3).restart()
        d.fx = d.x
        d.fy = d.y
      })
      .on("drag", (event, d) => {
        d.fx = event.x
        d.fy = event.y
      })
      .on("end", (event, d) => {
        if (!event.active) simulationRef.current?.alphaTarget(0)
        d.fx = null
        d.fy = null
      })

    nodeSel.call(drag)

    nodeSel.on("click", (_, d) => {
      onNodeClickRef.current(d.id)
    })

    const simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3.forceLink<NodeDatum, EdgeDatum>(edges).id((d) => d.id).distance(120)
      )
      .force("charge", d3.forceManyBody<NodeDatum>().strength(-300))
      .force("center", d3.forceCenter(w / 2, h / 2))
      // per-node gravity toward center — prevents disconnected nodes from drifting
      .force("x", d3.forceX<NodeDatum>(w / 2).strength(0.05))
      .force("y", d3.forceY<NodeDatum>(h / 2).strength(0.05))
      .force("collide", d3.forceCollide<NodeDatum>().radius((d) => nodeRadius(d) + 12))

    simulationRef.current = simulation

    simulation.on("tick", () => {
      // Clamp positions within SVG bounds so nodes never leave the canvas
      nodes.forEach((d) => {
        const r = nodeRadius(d)
        d.x = Math.max(r + 20, Math.min(w - r - 20, d.x ?? w / 2))
        d.y = Math.max(r + 20, Math.min(h - r - 20, d.y ?? h / 2))
      })

      linkSel
        .attr("x1", (d) => (d.source as NodeDatum).x ?? 0)
        .attr("y1", (d) => (d.source as NodeDatum).y ?? 0)
        .attr("x2", (d) => (d.target as NodeDatum).x ?? 0)
        .attr("y2", (d) => (d.target as NodeDatum).y ?? 0)

      nodeSel.attr("transform", (d) => `translate(${d.x ?? 0},${d.y ?? 0})`)
    })

    // Apply any pre-existing selection state after (re)building the graph
    const selId = selectedIdRef.current
    if (selId) {
      nodeSel.select("circle")
        .attr("stroke-width", (n) => n.id === selId ? 4 : 2)
        .attr("stroke-opacity", (n) => n.id === selId ? 1.0 : 0.35)
    }

    return () => {
      simulation.stop()
    }
  }, [graphData])

  if (loading) {
    return (
      <div
        className="flex items-center justify-center"
        style={{ height: "calc(100vh - 160px)", minHeight: "400px" }}
      >
        <p className="text-sm text-text-muted font-sans">Loading graph…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div
        className="flex items-center justify-center"
        style={{ height: "calc(100vh - 160px)", minHeight: "400px" }}
      >
        <p className="text-sm text-red-400 font-sans">{error}</p>
      </div>
    )
  }

  if (graphData?.nodes.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center text-center"
        style={{ height: "calc(100vh - 160px)", minHeight: "400px" }}
      >
        <p className="text-sm font-semibold font-sans text-text-base mb-1">
          No entities yet.
        </p>
        <p className="text-sm text-text-muted font-sans">
          Send Bird a message from Telegram to start building your graph.
        </p>
      </div>
    )
  }

  function handleDismiss() {
    localStorage.setItem("birdbot-graph-overlay-dismissed", "true")
    setDismissed(true)
  }

  const showOverlay = !dismissed && graphData !== null && graphData.nodes.length < 5

  return (
    <div style={{ height: "calc(100vh - 160px)", minHeight: "400px" }} className="relative">
      <svg ref={svgRef} className="w-full h-full" />
      {showOverlay && (
        <div
          className="absolute inset-0 flex items-center justify-center backdrop-blur-sm bg-depth/60"
          role="dialog"
          aria-modal="true"
          aria-labelledby="sparse-overlay-heading"
        >
          <div className="max-w-sm w-full mx-6 text-center px-6 py-8 rounded-2xl bg-panel border border-border">
            <h3 id="sparse-overlay-heading" className="font-heading font-bold text-lg text-text-base mb-3">
              Your knowledge graph is forming.
            </h3>
            <p className="text-sm font-sans text-text-muted leading-relaxed mb-6">
              Every message you send Bird adds nodes and connections here. Keep going — the more you share, the clearer the picture gets.
            </p>
            <button
              type="button"
              onClick={handleDismiss}
              className="px-5 py-2 rounded-lg bg-blue text-white text-sm font-semibold font-sans hover:bg-blue/80 transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
