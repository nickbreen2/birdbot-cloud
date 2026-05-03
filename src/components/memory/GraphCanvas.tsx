"use client"

import { NODE_COLORS, EntityTypeName } from "./graphConstants"
import { calcBoundingBox, calcViewportRect } from "./graphMiniMap"

export interface MiniMapNode {
  x: number
  y: number
  type: EntityTypeName
}

export interface MiniMapEdge {
  sourceX: number
  sourceY: number
  targetX: number
  targetY: number
}

export interface MiniMapTransform {
  x: number
  y: number
  k: number
}

export interface MiniMapData {
  nodes: MiniMapNode[]
  edges: MiniMapEdge[]
  transform: MiniMapTransform
  canvasWidth: number
  canvasHeight: number
}

interface GraphCanvasProps {
  children: React.ReactNode
  miniMapData: MiniMapData | null
  onZoomIn: () => void
  onZoomOut: () => void
  onFit: () => void
}

function MiniMapSvg({ data }: { data: MiniMapData }) {
  const { nodes, edges, transform, canvasWidth, canvasHeight } = data
  if (nodes.length === 0) return null

  const bb = calcBoundingBox(nodes, 30)
  const vp = calcViewportRect(transform, canvasWidth, canvasHeight)
  const viewBox = `${bb.minX} ${bb.minY} ${bb.width} ${bb.height}`
  const strokeW = Math.max(bb.width, bb.height) / 60

  return (
    <svg
      viewBox={viewBox}
      preserveAspectRatio="xMidYMid meet"
      style={{ display: "block", width: "100%", height: "100%" }}
    >
      {edges.map((e, i) => (
        <line
          key={i}
          x1={e.sourceX} y1={e.sourceY}
          x2={e.targetX} y2={e.targetY}
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={strokeW}
        />
      ))}
      {nodes.map((n, i) => (
        <circle
          key={i}
          cx={n.x} cy={n.y}
          r={strokeW * 2.5}
          fill={NODE_COLORS[n.type]}
          fillOpacity={0.85}
        />
      ))}
      <rect
        x={vp.x} y={vp.y}
        width={Math.max(vp.width, 0)} height={Math.max(vp.height, 0)}
        fill="none"
        stroke="rgba(59,130,246,0.55)"
        strokeWidth={strokeW * 1.2}
      />
    </svg>
  )
}

export default function GraphCanvas({
  children,
  miniMapData,
  onZoomIn,
  onZoomOut,
  onFit,
}: GraphCanvasProps) {
  return (
    <div className="gc">
      <div className="gc__overview">
        <div className="gc__overview-label">OVERVIEW</div>
        <div className="gc__overview-frame">
          {miniMapData && <MiniMapSvg data={miniMapData} />}
        </div>
      </div>

      <div className="gc__zoom">
        <button onClick={onZoomIn} aria-label="Zoom in">+</button>
        <button onClick={onZoomOut} aria-label="Zoom out">−</button>
        <button onClick={onFit} aria-label="Fit to view">⤢</button>
      </div>

      <div className="gc__canvas">{children}</div>
    </div>
  )
}
