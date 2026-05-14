import { calcBoundingBox, calcViewportRect } from "@/components/memory/graphMiniMap"

describe("calcBoundingBox", () => {
  it("returns bounding box with padding for a single node", () => {
    const result = calcBoundingBox([{ x: 100, y: 200 }], 20)
    expect(result).toEqual({ minX: 80, minY: 180, maxX: 120, maxY: 220, width: 40, height: 40 })
  })

  it("spans all nodes with padding", () => {
    const result = calcBoundingBox([{ x: 0, y: 0 }, { x: 100, y: 50 }], 10)
    expect(result).toEqual({ minX: -10, minY: -10, maxX: 110, maxY: 60, width: 120, height: 70 })
  })

  it("handles negative coordinates", () => {
    const result = calcBoundingBox([{ x: -50, y: -30 }, { x: 50, y: 30 }], 5)
    expect(result).toEqual({ minX: -55, minY: -35, maxX: 55, maxY: 35, width: 110, height: 70 })
  })

  it("returns zero bounding box for empty node array", () => {
    const result = calcBoundingBox([], 20)
    expect(result).toEqual({ minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 })
  })
})

describe("calcViewportRect", () => {
  it("identity transform returns full canvas as viewport", () => {
    const result = calcViewportRect({ x: 0, y: 0, k: 1 }, 800, 600)
    expect(result).toEqual({ x: 0, y: 0, width: 800, height: 600 })
  })

  it("2x zoom halves viewport dimensions", () => {
    const result = calcViewportRect({ x: 0, y: 0, k: 2 }, 800, 600)
    expect(result).toEqual({ x: 0, y: 0, width: 400, height: 300 })
  })

  it("pan offset shifts viewport origin in graph space", () => {
    const result = calcViewportRect({ x: 100, y: 50, k: 1 }, 800, 600)
    expect(result).toEqual({ x: -100, y: -50, width: 800, height: 600 })
  })

  it("combined zoom and pan", () => {
    const result = calcViewportRect({ x: 200, y: 100, k: 2 }, 800, 600)
    expect(result).toEqual({ x: -100, y: -50, width: 400, height: 300 })
  })

  it("clamps k=0 to avoid Infinity", () => {
    const result = calcViewportRect({ x: 0, y: 0, k: 0 }, 800, 600)
    expect(result).toEqual({ x: 0, y: 0, width: 800, height: 600 })
  })
})
