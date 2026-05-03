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
  return {
    x: -transform.x / transform.k || 0,
    y: -transform.y / transform.k || 0,
    width: canvasWidth / transform.k,
    height: canvasHeight / transform.k,
  }
}
