// src/types/wizard.ts

export type WizardStep = 1 | 2 | 3 | 4 | "summary" | "success" | "connect"

export const TRAIT_KEYS = [
  "professional",
  "friendly",
  "unhinged",
  "creative",
  "direct",
  "humor",
  "analytical",
  "supportive",
] as const

export type TraitKey = typeof TRAIT_KEYS[number]

export type Traits = Record<TraitKey, number>

export const TRAIT_LABELS: Record<TraitKey, string> = {
  professional: "Professional",
  friendly: "Friendly",
  unhinged: "Unhinged",
  creative: "Creative",
  direct: "Direct",
  humor: "Humor",
  analytical: "Analytical",
  supportive: "Supportive",
}

export const TOTAL_POINTS = 400
export const MIN_POINTS_TO_PROCEED = 20
