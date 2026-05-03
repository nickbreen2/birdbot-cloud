export interface BoundingBox {
  minX: number
  minY: number
  maxX: number
  maxY: number
  width: number
  height: number
}

export interface ViewportRect {
  x: number
  y: number
  width: number
  height: number
}

export function calcBoundingBox(
  nodes: { x: number; y: number }[],
  padding = 20
): BoundingBox {
  if (nodes.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 }
  }
  const xs = nodes.map((n) => n.x)
  const ys = nodes.map((n) => n.y)
  const minX = Math.min(...xs) - padding
  const minY = Math.min(...ys) - padding
  const maxX = Math.max(...xs) + padding
  const maxY = Math.max(...ys) + padding
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY }
}

export function calcViewportRect(
  transform: { x: number; y: number; k: number },
  canvasWidth: number,
  canvasHeight: number
): ViewportRect {
  const k = transform.k > 0 ? transform.k : 1
  return {
    x: -transform.x / k || 0,
    y: -transform.y / k || 0,
    width: canvasWidth / k,
    height: canvasHeight / k,
  }
}
