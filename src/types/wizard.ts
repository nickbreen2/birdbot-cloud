// src/types/wizard.ts

export type WizardStep = 1 | 2 | 3 | 4 | "summary" | "success"

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

export const FOCUS_AREAS = [
  { id: "email",    label: "Email Management", icon: "📧" },
  { id: "calendar", label: "Calendar",          icon: "📅" },
  { id: "research", label: "Research",          icon: "🔍" },
  { id: "biz",      label: "Business Ops",      icon: "⚙️" },
  { id: "tasks",    label: "Task Management",   icon: "✅" },
  { id: "code",     label: "Code & Dev",        icon: "💻" },
  { id: "finance",  label: "Personal Finance",  icon: "💰" },
  { id: "writing",  label: "Writing & Content", icon: "✍️" },
] as const

export type FocusId = typeof FOCUS_AREAS[number]["id"]

export type ModelId = typeof MODELS[number]["id"]

export type ChannelId = typeof CHANNELS[number]["id"]

export interface AgentConfig {
  name: string
  model: ModelId
  traits: Traits
  focusAreas: FocusId[]
  channels: ChannelId[]
  createdAt: string
}

export type CreateAgentPayload = AgentConfig & { id?: string }

export const MODELS = [
  {
    id: "kimi-k2.5",
    name: "Kimi K2.5",
    provider: "Moonshot AI via OpenRouter",
    desc: "Fast, capable, and included in your free tier.",
    iq: 62,
    free: true,
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "OpenAI",
    desc: "Industry-leading vision and reasoning from OpenAI.",
    iq: 88,
    free: false,
  },
  {
    id: "claude-sonnet-4",
    name: "Claude Sonnet 4",
    provider: "Anthropic",
    desc: "Exceptional writing, analysis, and nuanced reasoning.",
    iq: 91,
    free: false,
  },
  {
    id: "claude-opus-4",
    name: "Claude Opus 4",
    provider: "Anthropic",
    desc: "Most powerful Claude. Deep reasoning, long context.",
    iq: 96,
    free: false,
  },
  {
    id: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    provider: "Google DeepMind",
    desc: "Google's frontier model with massive context window.",
    iq: 93,
    free: false,
  },
  {
    id: "deepseek-r1",
    name: "DeepSeek R1",
    provider: "DeepSeek",
    desc: "Transparent chain-of-thought reasoning model.",
    iq: 89,
    free: false,
  },
] as const

export const CHANNELS = [
  { id: "web",       label: "Web Chat", icon: "💬", iconSrc: "",               available: true },
  { id: "imessage",  label: "iMessage", icon: "💬", iconSrc: "/IMessage.svg",  available: false },
  { id: "telegram",  label: "Telegram", icon: "✈️", iconSrc: "/Telegram.svg",  available: false },
  { id: "whatsapp",  label: "WhatsApp", icon: "💚", iconSrc: "/Whatsapp.svg",  available: false },
  { id: "discord",   label: "Discord",  icon: "🎮", iconSrc: "/Discord.svg",   available: false },
  { id: "slack",     label: "Slack",    icon: "💼", iconSrc: "/Slack.svg",     available: false },
] as const

export const TOTAL_POINTS = 400
export const MIN_POINTS_TO_PROCEED = 20
