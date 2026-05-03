"use client"

import { useEffect, useRef, useState } from "react"
import * as d3 from "d3"
import { EntityTypeName, NODE_COLORS } from "./graphConstants"
import GraphCanvas, { MiniMapData } from "./GraphCanvas"

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

function nodeRadius(d: NodeDatum): number {
  return 6 + Math.sqrt(Math.max(1, d.mentionCount)) * 4
}

function glowFilter(d: NodeDatum): string {
  if (d.mentionCount >= 6) return "url(#glow-strong)"
  if (d.mentionCount >= 2) return "url(#glow-mid)"
  return "url(#glow-soft)"
}

function edgePath(d: EdgeDatum): string {
  const sx = (d.source as NodeDatum).x ?? 0
  const sy = (d.source as NodeDatum).y ?? 0
  const tx = (d.target as NodeDatum).x ?? 0
  const ty = (d.target as NodeDatum).y ?? 0
  const dx = tx - sx
  const dy = ty - sy
  const dist = Math.sqrt(dx * dx + dy * dy) || 1
  const curve = Math.min(dist * 0.25, 50)
  const mx = (sx + tx) / 2 - (dy / dist) * curve
  const my = (sy + ty) / 2 + (dx / dist) * curve
  return `M${sx},${sy} Q${mx},${my} ${tx},${ty}`
}

interface GraphApiResponse {
  nodes: { id: string; name: string; type: EntityTypeName; description: string | null; mentionCount: number }[]
  edges: { id: string; fromId: string; toId: string; label: string }[]
}

export interface GraphNodeInfo { id: string; name: string; type: EntityTypeName }
export interface GraphEdgeInfo { fromId: string; toId: string }

interface GraphViewProps {
  onNodeClick: (id: string) => void
  selectedEntityId: string | null
  query?: string
  onDataLoaded?: (nodes: GraphNodeInfo[], edges: GraphEdgeInfo[]) => void
}

export default function GraphView({ onNodeClick, selectedEntityId, query = "", onDataLoaded }: GraphViewProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const simulationRef = useRef<d3.Simulation<NodeDatum, EdgeDatum> | null>(null)
  const onNodeClickRef = useRef(onNodeClick)
  const selectedIdRef = useRef(selectedEntityId)
  const nodeSelRef = useRef<d3.Selection<SVGGElement, NodeDatum, SVGGElement, unknown> | null>(null)
  const applyBaseRef = useRef<(() => void) | null>(null)
  const applySearchRef = useRef<((q: string) => void) | null>(null)
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null)
  const lastTransformRef = useRef<{ x: number; y: number; k: number }>({ x: 0, y: 0, k: 1 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [graphData, setGraphData] = useState<{ nodes: NodeDatum[]; edges: EdgeDatum[] } | null>(null)
  const [dismissed, setDismissed] = useState(() =>
    localStorage.getItem("birdbot-graph-overlay-dismissed") === "true"
  )
  const [miniMapData, setMiniMapData] = useState<MiniMapData | null>(null)

  useEffect(() => { onNodeClickRef.current = onNodeClick }, [onNodeClick])

  useEffect(() => {
    if (applySearchRef.current) applySearchRef.current(query)
  }, [query])

  useEffect(() => {
    selectedIdRef.current = selectedEntityId
    const nodeSel = nodeSelRef.current
    if (!nodeSel) return
    nodeSel.select("circle")
      .attr("stroke-width", (n) => n.id === selectedEntityId ? 4 : 2)
      .attr("stroke-opacity", (n) => n.id === selectedEntityId ? 1.0 : 0.35)
      .attr("filter", (n) => n.id === selectedEntityId ? "url(#glow-hover)" : glowFilter(n))
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
        onDataLoaded?.(nodes, edges.map((e) => ({ fromId: e.fromId, toId: e.toId })))
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Something went wrong"))
      .finally(() => setLoading(false))
  }, [])

  function handleZoomIn() {
    if (!svgRef.current || !zoomRef.current) return
    d3.select(svgRef.current).transition().duration(250).call(zoomRef.current.scaleBy, 1.3)
  }

  function handleZoomOut() {
    if (!svgRef.current || !zoomRef.current) return
    d3.select(svgRef.current).transition().duration(250).call(zoomRef.current.scaleBy, 0.75)
  }

  function handleFit() {
    if (!svgRef.current || !zoomRef.current) return
    d3.select(svgRef.current)
      .transition()
      .duration(400)
      .call(zoomRef.current.transform, d3.zoomIdentity)
  }

  useEffect(() => {
    if (!graphData || !svgRef.current) return

    const svg = d3.select(svgRef.current)
    const { width, height } = svgRef.current.getBoundingClientRect()
    const w = width || 800
    const h = height || 500

    if (simulationRef.current) simulationRef.current.stop()
    svg.selectAll("*").remove()

    if (graphData.nodes.length === 0) return

    // ── SVG filters ──────────────────────────────────────────────────────────
    const defs = svg.append("defs")

    function makeGlow(id: string, std: number) {
      const f = defs.append("filter")
        .attr("id", id)
        .attr("x", "-200%").attr("y", "-200%")
        .attr("width", "500%").attr("height", "500%")
      f.append("feGaussianBlur")
        .attr("in", "SourceGraphic")
        .attr("stdDeviation", std)
        .attr("result", "blur")
      const merge = f.append("feMerge")
      merge.append("feMergeNode").attr("in", "blur")
      merge.append("feMergeNode").attr("in", "SourceGraphic")
    }

    makeGlow("glow-soft",   2.5)
    makeGlow("glow-mid",    4)
    makeGlow("glow-strong", 6)
    makeGlow("glow-hover",  9)

    // ── Zoom + pan ────────────────────────────────────────────────────────────
    const container = svg.append("g")

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.15, 5])
      .on("zoom", (event) => {
        container.attr("transform", event.transform.toString())
        lastTransformRef.current = {
          x: event.transform.x,
          y: event.transform.y,
          k: event.transform.k,
        }
        updateMiniMap(lastTransformRef.current)
      })

    svg.call(zoom).on("dblclick.zoom", null)
    zoomRef.current = zoom

    // ── Data ──────────────────────────────────────────────────────────────────
    const nodes: NodeDatum[] = graphData.nodes.map((n) => ({ ...n }))
    const edges: EdgeDatum[] = graphData.edges.map((e) => ({ ...e }))

    function updateMiniMap(transform: { x: number; y: number; k: number }) {
      setMiniMapData({
        nodes: nodes.map((n) => ({ x: n.x ?? 0, y: n.y ?? 0, type: n.type })),
        edges: edges.map((e) => ({
          sourceX: (e.source as NodeDatum).x ?? 0,
          sourceY: (e.source as NodeDatum).y ?? 0,
          targetX: (e.target as NodeDatum).x ?? 0,
          targetY: (e.target as NodeDatum).y ?? 0,
        })),
        transform,
        canvasWidth: w,
        canvasHeight: h,
      })
    }

    // ── Edges (curved paths) ──────────────────────────────────────────────────
    const linkSel = container
      .append("g")
      .selectAll<SVGPathElement, EdgeDatum>("path")
      .data(edges)
      .join("path")
      .attr("fill", "none")
      .attr("stroke", "rgba(148,163,184,0.18)")
      .attr("stroke-width", 1.5)

    // ── Nodes ─────────────────────────────────────────────────────────────────
    const nodeSel = container
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
      .attr("fill-opacity", 0.88)
      .attr("stroke", (d) => NODE_COLORS[d.type])
      .attr("stroke-width", 2)
      .attr("stroke-opacity", 0.4)
      .attr("filter", glowFilter)

    nodeSel
      .append("text")
      .attr("dy", (d) => nodeRadius(d) + 13)
      .attr("text-anchor", "middle")
      .attr("fill", "#a1a1aa")
      .attr("font-size", "11px")
      .attr("font-family", "ui-sans-serif, system-ui, sans-serif")
      .attr("pointer-events", "none")
      .text((d) => d.name)

    // ── Style helpers ─────────────────────────────────────────────────────────
    function applyBaseStyles() {
      const selId = selectedIdRef.current
      linkSel.attr("stroke", "rgba(148,163,184,0.18)").attr("stroke-width", 1.5)
      nodeSel.select("circle")
        .attr("fill-opacity", 0.88)
        .attr("r", nodeRadius)
        .attr("stroke-opacity", (n) => n.id === selId ? 1.0 : 0.4)
        .attr("stroke-width", (n) => n.id === selId ? 4 : 2)
        .attr("filter", (n) => n.id === selId ? "url(#glow-hover)" : glowFilter(n))
      nodeSel.select("text").attr("fill", "#a1a1aa")
    }

    function applySearchHighlight(q: string) {
      if (!q) { applyBaseStyles(); return }
      const lower = q.toLowerCase()
      const matchIds = new Set(nodes.filter((n) => n.name.toLowerCase().includes(lower)).map((n) => n.id))
      linkSel
        .attr("stroke", (e) => {
          const src = (e.source as NodeDatum).id
          const tgt = (e.target as NodeDatum).id
          return matchIds.has(src) || matchIds.has(tgt) ? "rgba(148,163,184,0.5)" : "rgba(148,163,184,0.04)"
        })
      nodeSel.select("circle")
        .attr("fill-opacity", (n) => matchIds.has(n.id) ? 1.0 : 0.08)
        .attr("r", (n) => matchIds.has(n.id) ? nodeRadius(n) + 2 : nodeRadius(n))
        .attr("stroke-opacity", (n) => matchIds.has(n.id) ? 1.0 : 0.05)
        .attr("stroke-width", (n) => matchIds.has(n.id) ? 3 : 2)
        .attr("filter", (n) => matchIds.has(n.id) ? "url(#glow-hover)" : "url(#glow-soft)")
      nodeSel.select("text")
        .attr("fill", (n) => matchIds.has(n.id) ? "#e4e4e7" : "#27272a")
    }

    applyBaseRef.current = applyBaseStyles
    applySearchRef.current = applySearchHighlight

    // ── Hover ─────────────────────────────────────────────────────────────────
    nodeSel.on("mouseover", (_, d) => {
      const selId = selectedIdRef.current
      const neighbors = new Set<string>()
      edges.forEach((e) => {
        const src = (e.source as NodeDatum).id
        const tgt = (e.target as NodeDatum).id
        if (src === d.id) neighbors.add(tgt)
        if (tgt === d.id) neighbors.add(src)
      })

      linkSel
        .attr("stroke", (e) => {
          const src = (e.source as NodeDatum).id
          const tgt = (e.target as NodeDatum).id
          return src === d.id || tgt === d.id ? NODE_COLORS[d.type] + "55" : "rgba(148,163,184,0.04)"
        })
        .attr("stroke-width", (e) => {
          const src = (e.source as NodeDatum).id
          const tgt = (e.target as NodeDatum).id
          return src === d.id || tgt === d.id ? 2 : 1.5
        })

      nodeSel.select("circle")
        .attr("fill-opacity", (n) => {
          if (n.id === d.id) return 1.0
          if (neighbors.has(n.id)) return 0.88
          return 0.1
        })
        .attr("r", (n) => n.id === d.id ? nodeRadius(n) + 3 : nodeRadius(n))
        .attr("stroke-opacity", (n) => {
          if (n.id === d.id) return 1.0
          if (n.id === selId) return 0.8
          return neighbors.has(n.id) ? 0.4 : 0.05
        })
        .attr("stroke-width", (n) => {
          if (n.id === d.id) return n.id === selId ? 5 : 3
          return n.id === selId ? 4 : 2
        })
        .attr("filter", (n) => {
          if (n.id === d.id) return "url(#glow-hover)"
          if (neighbors.has(n.id)) return glowFilter(n)
          return "url(#glow-soft)"
        })

      nodeSel.select("text")
        .attr("fill", (n) =>
          n.id === d.id ? "#e4e4e7" : neighbors.has(n.id) ? "#a1a1aa" : "#3f3f46"
        )
    })

    nodeSel.on("mouseout", applyBaseStyles)

    // ── Drag ──────────────────────────────────────────────────────────────────
    const drag = d3.drag<SVGGElement, NodeDatum>()
      .on("start", (event, d) => {
        if (!event.active) simulationRef.current?.alphaTarget(0.3).restart()
        d.fx = d.x; d.fy = d.y
      })
      .on("drag", (event, d) => { d.fx = event.x; d.fy = event.y })
      .on("end", (event, d) => {
        if (!event.active) simulationRef.current?.alphaTarget(0)
        d.fx = null; d.fy = null
      })

    nodeSel.call(drag)
    nodeSel.on("click", (_, d) => { onNodeClickRef.current(d.id) })

    // ── Simulation ────────────────────────────────────────────────────────────
    const simulation = d3
      .forceSimulation(nodes)
      .force("link", d3.forceLink<NodeDatum, EdgeDatum>(edges).id((d) => d.id).distance(130))
      .force("charge", d3.forceManyBody<NodeDatum>().strength(-350))
      .force("center", d3.forceCenter(w / 2, h / 2))
      .force("x", d3.forceX<NodeDatum>(w / 2).strength(0.04))
      .force("y", d3.forceY<NodeDatum>(h / 2).strength(0.04))
      .force("collide", d3.forceCollide<NodeDatum>().radius((d) => nodeRadius(d) + 14))

    simulationRef.current = simulation

    simulation.on("tick", () => {
      linkSel.attr("d", edgePath)
      nodeSel.attr("transform", (d) => `translate(${d.x ?? 0},${d.y ?? 0})`)
      updateMiniMap(lastTransformRef.current)
    })

    // Restore selection ring after rebuild
    const selId = selectedIdRef.current
    if (selId) {
      nodeSel.select("circle")
        .attr("stroke-width", (n) => n.id === selId ? 4 : 2)
        .attr("stroke-opacity", (n) => n.id === selId ? 1.0 : 0.4)
        .attr("filter", (n) => n.id === selId ? "url(#glow-hover)" : glowFilter(n))
    }

    return () => {
      simulation.stop()
      svg.on(".zoom", null)
    }
  }, [graphData])

  if (loading) {
    return (
      <GraphCanvas miniMapData={null} onZoomIn={() => {}} onZoomOut={() => {}} onFit={() => {}}>
        <div className="w-full h-full flex items-center justify-center" style={{ minHeight: "400px" }}>
          <p className="text-sm text-text-muted font-sans">Loading graph…</p>
        </div>
      </GraphCanvas>
    )
  }

  if (error) {
    return (
      <GraphCanvas miniMapData={null} onZoomIn={() => {}} onZoomOut={() => {}} onFit={() => {}}>
        <div className="w-full h-full flex items-center justify-center" style={{ minHeight: "400px" }}>
          <p className="text-sm text-red-400 font-sans">{error}</p>
        </div>
      </GraphCanvas>
    )
  }

  if (graphData?.nodes.length === 0) {
    return (
      <GraphCanvas miniMapData={null} onZoomIn={() => {}} onZoomOut={() => {}} onFit={() => {}}>
        <div className="w-full h-full flex flex-col items-center justify-center text-center" style={{ minHeight: "400px" }}>
          <p className="text-sm font-semibold font-sans text-text-base mb-1">No entities yet.</p>
          <p className="text-sm text-text-muted font-sans">Send Bird a message from Telegram to start building your graph.</p>
        </div>
      </GraphCanvas>
    )
  }

  function handleDismiss() {
    localStorage.setItem("birdbot-graph-overlay-dismissed", "true")
    setDismissed(true)
  }

  const showOverlay = !dismissed && graphData !== null && graphData.nodes.length < 5

  return (
    <GraphCanvas
      miniMapData={miniMapData}
      onZoomIn={handleZoomIn}
      onZoomOut={handleZoomOut}
      onFit={handleFit}
    >
      <svg ref={svgRef} className="w-full h-full" />

      {showOverlay && (
        <div
          className="absolute inset-0 flex items-center justify-center backdrop-blur-sm bg-depth/60"
          role="dialog" aria-modal="true" aria-labelledby="sparse-overlay-heading"
        >
          <div className="max-w-sm w-full mx-6 text-center px-6 py-8 rounded-2xl bg-panel border border-border">
            <h3 id="sparse-overlay-heading" className="font-heading font-bold text-lg text-text-base mb-3">
              Your knowledge graph is forming.
            </h3>
            <p className="text-sm font-sans text-text-muted leading-relaxed mb-6">
              Every message you send Bird adds nodes and connections here. Keep going — the more you share, the clearer the picture gets.
            </p>
            <button
              type="button" onClick={handleDismiss}
              className="px-5 py-2 rounded-lg bg-blue text-white text-sm font-semibold font-sans hover:bg-blue/80 transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </GraphCanvas>
  )
}
