"use client"

import { useState, useEffect, useRef, type ReactNode } from "react"
import { X, Menu } from "lucide-react"
import { useWizard } from "@/components/dashboard/WizardContext"
import { TraitSlider } from "@/components/wizard/TraitSlider"
import { FocusAreaGrid } from "@/components/wizard/FocusAreaGrid"
import { ModelSelector } from "@/components/wizard/ModelSelector"
import {
  CHANNELS,
  TRAIT_KEYS,
  TRAIT_LABELS,
  TOTAL_POINTS,
  MIN_POINTS_TO_PROCEED,
  type Traits,
  type FocusId,
  type ModelId,
  type CreateAgentPayload,
} from "@/types/wizard"
import type { AgentData } from "@/components/dashboard/WizardContext"

type SettingsSection = "profile" | "personality" | "focus" | "channels" | "danger"

const NAV_ITEMS: { id: SettingsSection; label: string }[] = [
  { id: "profile",     label: "Agent Profile" },
  { id: "personality", label: "Personality" },
  { id: "focus",       label: "Focus Areas" },
  { id: "channels",    label: "Channels" },
]

const SECTION_META: Record<SettingsSection, { title: string; subtitle: string }> = {
  profile:     { title: "Agent Profile",  subtitle: "Update your agent's name and AI model." },
  personality: { title: "Personality",    subtitle: "Each trait is 0–100. Distribute your 400 points across all 8 traits." },
  focus:       { title: "Focus Areas",    subtitle: "What should your agent prioritize? At least one must be selected." },
  channels:    { title: "Channels",       subtitle: "Where your agent is available. More channels coming soon." },
  danger:      { title: "Danger Zone",    subtitle: "Irreversible actions. Proceed with caution." },
}

export function SettingsModal() {
  const { settingsOpen, setSettingsOpen, agents, refreshAgents } = useWizard()
  const [section, setSection] = useState<SettingsSection>("profile")
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const agent = agents[0] ?? null

  useEffect(() => {
    if (settingsOpen) {
      setSection("profile")
      setMobileNavOpen(false)
    }
  }, [settingsOpen])

  function selectSection(id: SettingsSection) {
    setSection(id)
    setMobileNavOpen(false)
  }

  if (!settingsOpen || !agent) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(6,9,18,0.92)", backdropFilter: "blur(6px)" }}
      onClick={() => setSettingsOpen(false)}
    >
      <div
        className="w-full max-w-[860px] rounded-2xl border border-border overflow-hidden flex relative h-[90vh] md:h-[700px]"
        style={{
          background: "#111827",
          boxShadow:
            "0 0 0 1px rgba(37,99,235,0.18), 0 0 100px rgba(37,99,235,0.18), 0 60px 120px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Mobile nav overlay ───────────────────────────────────────── */}
        {mobileNavOpen && (
          <div
            className="md:hidden absolute inset-0 z-10 flex flex-col"
            style={{ background: "#0a0e1a" }}
          >
            <div className="flex items-center justify-between px-5 py-5 border-b border-border flex-shrink-0">
              <div>
                <h2 className="text-lg font-sans font-semibold text-text-base leading-tight">BirdBot Settings</h2>
                <p className="text-xs text-text-muted font-sans mt-1">Manage your BirdBot agent.</p>
              </div>
              <button
                onClick={() => setMobileNavOpen(false)}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-text-muted hover:text-text-base hover:bg-white/[0.06] transition-all"
                aria-label="Close menu"
              >
                <X size={18} strokeWidth={2} />
              </button>
            </div>
            <nav className="flex-1 flex flex-col px-2 py-3 gap-0.5 overflow-y-auto">
              {NAV_ITEMS.map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => selectSection(id)}
                  className={`w-full text-left px-4 py-3.5 text-sm font-sans transition-all rounded-xl ${
                    section === id
                      ? "border-l-2 border-blue-bright text-blue-bright font-medium"
                      : "border-l-2 border-transparent text-text-muted hover:text-text-dim hover:bg-white/[0.03]"
                  }`}
                  style={
                    section === id
                      ? { background: "linear-gradient(90deg, rgba(37,99,235,0.18) 0%, rgba(37,99,235,0.04) 100%)" }
                      : undefined
                  }
                >
                  {label}
                </button>
              ))}
            </nav>
            <div className="px-2 pb-6 pt-3 border-t border-border">
              <button
                onClick={() => selectSection("danger")}
                className={`w-full text-left px-4 py-3.5 text-sm font-sans transition-all rounded-xl ${
                  section === "danger"
                    ? "border-l-2 border-red-400 text-red-300 font-medium"
                    : "border-l-2 border-transparent text-red-400 hover:text-red-300 hover:bg-red-500/[0.08]"
                }`}
                style={
                  section === "danger"
                    ? { background: "linear-gradient(90deg, rgba(239,68,68,0.20) 0%, rgba(239,68,68,0.05) 100%)" }
                    : undefined
                }
              >
                ⚠ Danger Zone
              </button>
            </div>
          </div>
        )}

        {/* ── Left sidebar ─────────────────────────────────────────────── */}
        <div
          className="hidden md:flex w-56 flex-shrink-0 flex-col border-r border-border"
          style={{ background: "#0a0e1a" }}
        >
          {/* Header */}
          <div className="px-5 pt-6 pb-5">
            <h2 className="text-lg font-sans font-semibold text-text-base leading-tight">BirdBot Settings</h2>
            <p className="text-xs text-text-muted font-sans mt-1">Manage your BirdBot agent.</p>
          </div>

          {/* Nav */}
          <nav className="flex-1 flex flex-col px-2 gap-0.5">
            {NAV_ITEMS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setSection(id)}
                className={`w-full text-left px-3 py-2.5 text-sm font-sans transition-all rounded-r-xl ${
                  section === id
                    ? "border-l-2 border-blue-bright text-blue-bright font-medium"
                    : "border-l-2 border-transparent text-text-muted hover:text-text-dim hover:bg-white/[0.03]"
                }`}
                style={
                  section === id
                    ? { background: "linear-gradient(90deg, rgba(37,99,235,0.18) 0%, rgba(37,99,235,0.04) 100%)" }
                    : undefined
                }
              >
                {label}
              </button>
            ))}
          </nav>

          {/* Danger Zone */}
          <div className="px-2 pb-4 pt-3 border-t border-border mt-2">
            <button
              onClick={() => setSection("danger")}
              className={`w-full text-left px-3 py-2.5 text-sm font-sans transition-all rounded-r-xl ${
                section === "danger"
                  ? "border-l-2 border-red-400 text-red-300 font-medium"
                  : "border-l-2 border-transparent text-red-400 hover:text-red-300 hover:bg-red-500/[0.08]"
              }`}
              style={
                section === "danger"
                  ? { background: "linear-gradient(90deg, rgba(239,68,68,0.20) 0%, rgba(239,68,68,0.05) 100%)" }
                  : undefined
              }
            >
              ⚠ Danger Zone
            </button>
          </div>
        </div>

        {/* ── Right content ─────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0" style={{ background: "#111827" }}>
          {/* Sticky header */}
          <div
            className="flex items-center px-4 md:px-8 py-5 flex-shrink-0"
            style={{
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              background: "#111827",
            }}
          >
            {/* Hamburger - mobile only */}
            <button
              className="md:hidden mr-3 w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-base hover:bg-white/[0.06] transition-all flex-shrink-0"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation"
            >
              <Menu size={18} strokeWidth={2} />
            </button>
            <div className="flex-1 min-w-0">
              <h3 className="font-sans font-semibold text-base text-text-base leading-tight truncate">
                {SECTION_META[section].title}
              </h3>
              <p className="text-xs text-text-muted font-sans mt-0.5 truncate">{SECTION_META[section].subtitle}</p>
            </div>
            <button
              onClick={() => setSettingsOpen(false)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-base hover:bg-white/[0.06] transition-all ml-4 flex-shrink-0"
              aria-label="Close settings"
            >
              <X size={16} strokeWidth={2} />
            </button>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto">
            {section === "profile"     && <ProfileSection     agent={agent} refreshAgents={refreshAgents} />}
            {section === "personality" && <PersonalitySection agent={agent} refreshAgents={refreshAgents} />}
            {section === "focus"       && <FocusSection       agent={agent} refreshAgents={refreshAgents} />}
            {section === "channels"    && <ChannelsSection />}
            {section === "danger"      && <DangerSection      agent={agent} refreshAgents={refreshAgents} onClose={() => setSettingsOpen(false)} />}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Shared helpers ─────────────────────────────────────────────────────────────

async function saveAgent(payload: CreateAgentPayload): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch("/api/agents/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  return res.json() as Promise<{ ok: boolean; error?: string }>
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="text-[11px] font-semibold font-sans text-text-muted uppercase tracking-widest">
      {children}
    </label>
  )
}

function SaveButton({
  disabled,
  saving,
  saved,
  onClick,
}: {
  disabled: boolean
  saving: boolean
  saved: boolean
  onClick: () => void
}) {
  const isSaved = saved && !saving
  return (
    <button
      disabled={disabled || saving}
      onClick={onClick}
      className="px-5 py-2.5 rounded-xl text-sm font-semibold font-sans text-white disabled:opacity-35 disabled:cursor-not-allowed transition-all"
      style={
        isSaved
          ? { background: "linear-gradient(135deg,#166534,#22c55e)", boxShadow: "0 0 20px rgba(34,197,94,0.35)" }
          : disabled || saving
          ? { background: "#2563eb" }
          : { background: "linear-gradient(135deg,#2563eb,#3b82f6)", boxShadow: "0 0 20px rgba(37,99,235,0.45)" }
      }
    >
      {saving ? "Saving…" : isSaved ? "Saved ✓" : "Save Changes"}
    </button>
  )
}

// ── Section: Agent Profile ─────────────────────────────────────────────────────

function ProfileSection({ agent, refreshAgents }: { agent: AgentData; refreshAgents: () => void }) {
  const [name, setName]   = useState(agent.name)
  const [model, setModel] = useState<ModelId>(agent.model as ModelId)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)
  const [error, setError]   = useState("")

  const unchanged = name === agent.name && model === agent.model
  const nameValid = name.trim().length >= 2 && name.trim().length <= 24

  async function handleSave() {
    setSaving(true)
    setError("")
    const result = await saveAgent({
      id: agent.id,
      name,
      model,
      traits: agent.traits as Traits,
      focusAreas: agent.focusAreas as FocusId[],
      channels: agent.channels as string[] as never,
      createdAt: agent.createdAt,
    })
    setSaving(false)
    if (result.ok) {
      refreshAgents()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } else {
      setError(result.error ?? "Something went wrong.")
    }
  }

  return (
    <div className="px-4 py-5 md:px-8 md:py-7 flex flex-col gap-7">
      {/* Name */}
      <div className="flex flex-col gap-2">
        <FieldLabel>Agent name (2–24 characters)</FieldLabel>
        <input
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); setSaved(false) }}
          maxLength={24}
          placeholder="e.g. Chirpy, Atlas, Max…"
          className="px-4 py-3 rounded-xl text-text-base placeholder:text-text-muted font-sans text-sm focus:outline-none transition-all"
          style={{
            background: "#1a2235",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
          onFocus={(e) => {
            e.currentTarget.style.border = "1px solid rgba(59,130,246,0.6)"
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.12)"
          }}
          onBlur={(e) => {
            e.currentTarget.style.border = "1px solid rgba(255,255,255,0.07)"
            e.currentTarget.style.boxShadow = "none"
          }}
        />
      </div>

      {/* Status */}
      <div className="flex flex-col gap-2">
        <FieldLabel>Status</FieldLabel>
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2 w-2 flex-shrink-0">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${
                agent.status === "active" || agent.status === "online" ? "bg-emerald" : "bg-slate-500"
              }`}
            />
            <span
              className={`relative inline-flex h-2 w-2 rounded-full ${
                agent.status === "active" || agent.status === "online" ? "bg-emerald" : "bg-slate-500"
              }`}
            />
          </span>
          <span className="text-sm font-sans text-text-dim capitalize">{agent.status}</span>
        </div>
      </div>

      {/* Model */}
      <div className="flex flex-col gap-2">
        <FieldLabel>AI Model</FieldLabel>
        <ModelSelector value={model} onChange={(v) => { setModel(v); setSaved(false) }} />
        <p className="text-[11px] text-text-muted font-sans">Upgrade to PRO to unlock all models</p>
      </div>

      {error && <p className="text-xs text-red-400 font-sans">{error}</p>}

      <div className="flex justify-end pt-1">
        <SaveButton disabled={unchanged || !nameValid} saving={saving} saved={saved} onClick={handleSave} />
      </div>
    </div>
  )
}

// ── Section: Personality ───────────────────────────────────────────────────────

function PersonalitySection({ agent, refreshAgents }: { agent: AgentData; refreshAgents: () => void }) {
  const [traits, setTraits] = useState<Traits>({ ...(agent.traits as Traits) })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)
  const [error, setError]   = useState("")

  const traitsTotal = TRAIT_KEYS.reduce((s, k) => s + traits[k], 0)
  const remaining   = TOTAL_POINTS - traitsTotal
  const canProceed  = traitsTotal >= MIN_POINTS_TO_PROCEED
  const unchanged   = JSON.stringify(traits) === JSON.stringify(agent.traits)

  function handleSlider(key: keyof Traits, rawValue: number) {
    const othersTotal = TRAIT_KEYS.reduce((s, k) => k === key ? s : s + traits[k], 0)
    const capped = Math.min(rawValue, TOTAL_POINTS - othersTotal)
    setTraits({ ...traits, [key]: capped })
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    setError("")
    const result = await saveAgent({
      id: agent.id,
      name: agent.name,
      model: agent.model as ModelId,
      traits,
      focusAreas: agent.focusAreas as FocusId[],
      channels: agent.channels as string[] as never,
      createdAt: agent.createdAt,
    })
    setSaving(false)
    if (result.ok) {
      refreshAgents()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } else {
      setError(result.error ?? "Something went wrong.")
    }
  }

  return (
    <div className="px-4 py-5 md:px-8 md:py-7 flex flex-col gap-5">
      {/* Budget bar */}
      <div
        className="flex items-center gap-4 px-4 py-3 rounded-xl"
        style={{ background: "#1a2235", border: "1px solid rgba(255,255,255,0.07)" }}
      >
        <span className="text-xs font-medium font-sans text-text-muted whitespace-nowrap">Points left</span>
        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${(remaining / TOTAL_POINTS) * 100}%`,
              background:
                remaining === 0
                  ? "linear-gradient(90deg,#166534,#4ade80)"
                  : remaining < 40
                  ? "linear-gradient(90deg,#c2410c,#fb923c)"
                  : "linear-gradient(90deg,#2563eb,#60a5fa)",
            }}
          />
        </div>
        <span
          className="text-base font-black font-sans min-w-[2.5rem] text-right tabular-nums"
          style={{ color: remaining === 0 ? "#4ade80" : remaining < 40 ? "#fb923c" : "#f59e0b" }}
        >
          {remaining}
        </span>
      </div>

      {/* Sliders */}
      <div className="flex flex-col gap-3">
        {TRAIT_KEYS.map((key) => (
          <TraitSlider
            key={key}
            label={TRAIT_LABELS[key]}
            value={traits[key]}
            onChange={(v) => handleSlider(key, v)}
          />
        ))}
      </div>

      {!canProceed && (
        <p className="text-xs text-red-400 font-sans">Allocate at least {MIN_POINTS_TO_PROCEED} points to save.</p>
      )}
      {error && <p className="text-xs text-red-400 font-sans">{error}</p>}

      <div className="flex justify-end pt-1">
        <SaveButton disabled={unchanged || !canProceed} saving={saving} saved={saved} onClick={handleSave} />
      </div>
    </div>
  )
}

// ── Section: Focus Areas ───────────────────────────────────────────────────────

function FocusSection({ agent, refreshAgents }: { agent: AgentData; refreshAgents: () => void }) {
  const [focusAreas, setFocusAreas] = useState<FocusId[]>([...(agent.focusAreas as FocusId[])])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)
  const [error, setError]   = useState("")

  const unchanged = [...focusAreas].sort().join() === [...(agent.focusAreas as FocusId[])].sort().join()

  async function handleSave() {
    setSaving(true)
    setError("")
    const result = await saveAgent({
      id: agent.id,
      name: agent.name,
      model: agent.model as ModelId,
      traits: agent.traits as Traits,
      focusAreas,
      channels: agent.channels as string[] as never,
      createdAt: agent.createdAt,
    })
    setSaving(false)
    if (result.ok) {
      refreshAgents()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } else {
      setError(result.error ?? "Something went wrong.")
    }
  }

  return (
    <div className="px-4 py-5 md:px-8 md:py-7 flex flex-col gap-5">
      <FocusAreaGrid
        selected={focusAreas}
        onChange={(v) => { setFocusAreas(v); setSaved(false) }}
      />

      {error && <p className="text-xs text-red-400 font-sans">{error}</p>}

      <div className="flex justify-end pt-1">
        <SaveButton
          disabled={unchanged || focusAreas.length === 0}
          saving={saving}
          saved={saved}
          onClick={handleSave}
        />
      </div>
    </div>
  )
}

// ── Section: Channels ──────────────────────────────────────────────────────────

function ChannelsSection() {
  return (
    <div className="px-4 py-5 md:px-8 md:py-7 flex flex-col gap-3">
      {CHANNELS.map((c) => (
        <div
          key={c.id}
          className="flex items-center justify-between px-4 py-3.5 rounded-xl transition-colors"
          style={{ background: "#1a2235", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div className="flex items-center gap-3">
            {c.iconSrc
              ? <img src={c.iconSrc} alt={c.label} className="w-6 h-6 object-contain" />
              : <span className="text-xl">{c.icon}</span>
            }
            <span className="text-sm font-sans font-medium text-text-base">{c.label}</span>
          </div>
          {c.available ? (
            <span
              className="text-[10px] font-bold tracking-wide px-2.5 py-1 rounded-md"
              style={{
                background: "rgba(34,197,94,0.12)",
                border: "1px solid rgba(34,197,94,0.3)",
                color: "#4ade80",
              }}
            >
              CONNECTED
            </span>
          ) : (
            <span
              className="text-[10px] font-bold tracking-wide px-2.5 py-1 rounded-md"
              style={{
                background: "rgba(100,116,139,0.1)",
                border: "1px solid rgba(100,116,139,0.2)",
                color: "#64748b",
              }}
            >
              COMING SOON
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

// ── Section: Danger Zone ───────────────────────────────────────────────────────

function DangerSection({
  agent,
  refreshAgents,
  onClose,
}: {
  agent: AgentData
  refreshAgents: () => void
  onClose: () => void
}) {
  const [confirming, setConfirming] = useState(false)
  const [killInput, setKillInput]   = useState("")
  const [deleting, setDeleting]     = useState(false)
  const [error, setError]           = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const killPhrase = `Kill ${agent.name} Forever`
  const canDelete  = killInput === killPhrase

  function startConfirm() {
    setConfirming(true)
    setKillInput("")
    setError("")
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  async function handleDelete() {
    setDeleting(true)
    setError("")
    try {
      const res = await fetch(`/api/agents/${agent.id}`, { method: "DELETE" })
      const data = await res.json() as { ok: boolean; error?: string }
      if (data.ok) {
        refreshAgents()
        onClose()
      } else {
        setError(data.error ?? "Something went wrong.")
        setDeleting(false)
      }
    } catch {
      setError("Network error. Please try again.")
      setDeleting(false)
    }
  }

  return (
    <div className="px-4 py-5 md:px-8 md:py-7 flex flex-col gap-5">
      {!confirming ? (
        <div
          className="rounded-xl p-5 flex flex-col gap-4"
          style={{
            background: "linear-gradient(135deg, rgba(239,68,68,0.08) 0%, rgba(239,68,68,0.03) 100%)",
            border: "1px solid rgba(239,68,68,0.35)",
            boxShadow: "inset 0 0 40px rgba(239,68,68,0.04)",
          }}
        >
          <div>
            <p className="text-sm font-semibold text-red-400 font-sans">Delete this BirdBot</p>
            <p className="text-xs text-text-muted font-sans mt-1.5 leading-relaxed">
              Permanently deletes your BirdBot agent and all its data. You will be returned to setup.
            </p>
          </div>
          <div>
            <button
              onClick={startConfirm}
              className="px-4 py-2 rounded-xl text-sm font-semibold font-sans transition-all"
              style={{
                border: "1px solid rgba(239,68,68,0.6)",
                color: "#f87171",
                background: "transparent",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(239,68,68,0.12)"
                e.currentTarget.style.boxShadow = "0 0 16px rgba(239,68,68,0.2)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent"
                e.currentTarget.style.boxShadow = "none"
              }}
            >
              Kill {agent.name}
            </button>
          </div>
        </div>
      ) : (
        <div
          className="rounded-xl p-5 flex flex-col gap-5"
          style={{
            background: "linear-gradient(135deg, rgba(239,68,68,0.10) 0%, rgba(239,68,68,0.04) 100%)",
            border: "1px solid rgba(239,68,68,0.5)",
            boxShadow: "0 0 40px rgba(239,68,68,0.08)",
          }}
        >
          <div>
            <p className="text-sm font-semibold text-red-400 font-sans">⚠ Kill {agent.name} Forever?</p>
            <p className="text-xs text-text-muted font-sans mt-1.5 leading-relaxed">
              This cannot be undone. Your BirdBot will be permanently destroyed and you will be returned to setup.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-semibold font-sans text-text-muted uppercase tracking-widest">
              Type <span className="text-red-400 font-mono normal-case tracking-normal">{killPhrase}</span> to confirm
            </label>
            <input
              ref={inputRef}
              type="text"
              value={killInput}
              onChange={(e) => setKillInput(e.target.value)}
              placeholder={killPhrase}
              className="px-4 py-3 rounded-xl text-text-base placeholder:text-text-muted font-sans text-sm focus:outline-none transition-all"
              style={{
                background: "#1a2235",
                border: "1px solid rgba(239,68,68,0.3)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.border = "1px solid rgba(239,68,68,0.6)"
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(239,68,68,0.10)"
              }}
              onBlur={(e) => {
                e.currentTarget.style.border = "1px solid rgba(239,68,68,0.3)"
                e.currentTarget.style.boxShadow = "none"
              }}
            />
          </div>

          {error && <p className="text-xs text-red-400 font-sans">{error}</p>}

          <div className="flex items-center gap-3">
            <button
              onClick={() => { setConfirming(false); setKillInput("") }}
              className="px-4 py-2 rounded-xl text-sm font-semibold font-sans border border-border text-text-dim hover:text-text-base hover:bg-white/[0.04] transition-all"
            >
              Cancel
            </button>
            <button
              disabled={!canDelete || deleting}
              onClick={handleDelete}
              className="px-4 py-2 rounded-xl text-sm font-semibold font-sans text-white disabled:opacity-35 disabled:cursor-not-allowed transition-all"
              style={
                canDelete && !deleting
                  ? {
                      background: "linear-gradient(135deg,#b91c1c,#ef4444)",
                      boxShadow: "0 0 20px rgba(239,68,68,0.4)",
                    }
                  : { background: "#7f1d1d" }
              }
            >
              {deleting ? "Deleting…" : killPhrase}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
