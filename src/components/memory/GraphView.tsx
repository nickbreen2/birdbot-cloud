"use client"

import { useEffect, useRef, useState } from "react"
import * as d3 from "d3"

type EntityTypeName = "file" | "concept" | "decision" | "task" | "technology" | "person" | "goal"

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

export default function GraphView() {
  const svgRef = useRef<SVGSVGElement>(null)
  const simulationRef = useRef<d3.Simulation<NodeDatum, EdgeDatum> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [graphData, setGraphData] = useState<{ nodes: NodeDatum[]; edges: EdgeDatum[] } | null>(null)

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

    const simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3.forceLink<NodeDatum, EdgeDatum>(edges).id((d) => d.id).distance(120)
      )
      .force("charge", d3.forceManyBody<NodeDatum>().strength(-300))
      .force("center", d3.forceCenter(w / 2, h / 2))
      .force("collide", d3.forceCollide<NodeDatum>().radius((d) => nodeRadius(d) + 12))

    simulationRef.current = simulation

    simulation.on("tick", () => {
      linkSel
        .attr("x1", (d) => (d.source as NodeDatum).x ?? 0)
        .attr("y1", (d) => (d.source as NodeDatum).y ?? 0)
        .attr("x2", (d) => (d.target as NodeDatum).x ?? 0)
        .attr("y2", (d) => (d.target as NodeDatum).y ?? 0)

      nodeSel.attr("transform", (d) => `translate(${d.x ?? 0},${d.y ?? 0})`)
    })

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

  return (
    <div style={{ height: "calc(100vh - 160px)", minHeight: "400px" }}>
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  )
}
