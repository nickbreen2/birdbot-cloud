export type EntityTypeName =
  | "file" | "concept" | "date" | "decision"
  | "task" | "technology" | "person" | "goal"

export const NODE_COLORS: Record<EntityTypeName, string> = {
  goal:       "#d97706",
  task:       "#3b82f6",
  concept:    "#71717a",
  date:       "#d946ef",
  technology: "#8b5cf6",
  person:     "#f43f5e",
  decision:   "#f97316",
  file:       "#10b981",
}
