// src/components/dashboard/AgentSetupWizard.tsx
"use client"

import { useState } from "react"
import { useUser } from "@clerk/nextjs"
import {
  MODELS,
  TRAIT_KEYS,
  TRAIT_LABELS,
  FOCUS_AREAS,
  CHANNELS,
  TOTAL_POINTS,
  MIN_POINTS_TO_PROCEED,
  type WizardStep,
  type Traits,
  type FocusId,
  type ModelId,
  type CreateAgentPayload,
} from "@/types/wizard"

// ── Initial state ─────────────────────────────────────────────────────────────

const emptyTraits: Traits = {
  professional: 0, friendly: 0, unhinged: 0, creative: 0,
  direct: 0, humor: 0, analytical: 0, supportive: 0,
}

// ── Root component ────────────────────────────────────────────────────────────

export function AgentSetupWizard() {
  const { user, isLoaded } = useUser()

  if (!isLoaded) return null
  if (user?.publicMetadata?.onboarded) return null

  return <WizardOverlay />
}

// ── Overlay (uncloseable) ─────────────────────────────────────────────────────

function WizardOverlay() {
  const { user } = useUser()

  const [step, setStep] = useState<WizardStep>(1)
  const [agentName, setAgentName] = useState("")
  const [model, setModel] = useState<ModelId>("kimi-k2.5")
  const [traits, setTraits] = useState<Traits>(emptyTraits)
  const [focusAreas, setFocusAreas] = useState<FocusId[]>([])
  const [deploying, setDeploying] = useState(false)
  const [deployError, setDeployError] = useState("")

  const traitsTotal = TRAIT_KEYS.reduce((s, k) => s + traits[k], 0)

  async function handleDeploy() {
    setDeploying(true)
    setDeployError("")
    const payload: CreateAgentPayload = {
      name: agentName.trim(),
      model,
      traits,
      focusAreas,
      channels: ["web"],
      createdAt: new Date().toISOString(),
    }
    try {
      const res = await fetch("/api/agents/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json() as { ok: boolean; error?: string }
      if (data.ok) {
        await user?.reload()
        setStep("success")
      } else {
        setDeployError(data.error ?? "Something went wrong. Please try again.")
      }
    } catch {
      setDeployError("Network error. Please try again.")
    } finally {
      setDeploying(false)
    }
  }

  const stepNumber = typeof step === "number" ? step : step === "summary" ? 5 : 6

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(9,13,26,0.88)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-panel border border-border overflow-hidden"
        style={{ boxShadow: "0 0 80px rgba(37,99,235,0.12), 0 40px 80px rgba(0,0,0,0.7)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-7 py-5 border-b border-border bg-depth">
          <span className="text-xl select-none">🐦</span>
          <div>
            <h2 className="font-heading font-bold text-base text-text-base">
              {step === "success"
                ? `${agentName} is hatching!`
                : step === "summary"
                ? "Review & Deploy"
                : `Create Your BirdBot — Step ${step} of 4`}
            </h2>
            <p className="text-xs text-text-muted font-sans">Set up your personal AI agent</p>
          </div>
        </div>

        {/* Step progress bar — hidden on success */}
        {step !== "success" && (
          <StepBar current={typeof step === "number" ? step : 5} />
        )}

        {/* Step content */}
        {step === 1 && (
          <Step1
            agentName={agentName}
            model={model}
            onNameChange={setAgentName}
            onModelChange={setModel}
            onNext={() => setStep(2)}
          />
        )}
        {step === 2 && (
          <Step2
            traits={traits}
            total={traitsTotal}
            onTraitsChange={setTraits}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        )}
        {step === 3 && (
          <Step3
            focusAreas={focusAreas}
            onFocusChange={setFocusAreas}
            onBack={() => setStep(2)}
            onNext={() => setStep(4)}
          />
        )}
        {step === 4 && (
          <Step4
            onBack={() => setStep(3)}
            onNext={() => setStep("summary")}
          />
        )}
        {step === "summary" && (
          <StepSummary
            agentName={agentName}
            model={model}
            traits={traits}
            focusAreas={focusAreas}
            deploying={deploying}
            deployError={deployError}
            onBack={() => setStep(4)}
            onDeploy={handleDeploy}
          />
        )}
        {step === "success" && <StepSuccess agentName={agentName} />}
      </div>
    </div>
  )
}

// ── Step progress bar ─────────────────────────────────────────────────────────

function StepBar({ current }: { current: number }) {
  const steps = [
    { n: 1, label: "Model" },
    { n: 2, label: "Personality" },
    { n: 3, label: "Focus" },
    { n: 4, label: "Channels" },
  ]
  return (
    <div className="flex items-center px-7 py-4 border-b border-border bg-depth/60">
      {steps.map((s, i) => (
        <div key={s.n} className="flex items-center flex-1">
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                s.n < current
                  ? "bg-blue border-blue text-white"
                  : s.n === current
                  ? "bg-blue/10 border-blue text-blue-bright"
                  : "bg-panel border-border text-text-muted"
              }`}
            >
              {s.n < current ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
              ) : s.n}
            </div>
            <span
              className={`text-[11px] font-semibold font-sans ${
                s.n < current ? "text-blue-bright" : s.n === current ? "text-blue-bright" : "text-text-muted"
              }`}
            >
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`flex-1 h-px mx-2 mb-5 ${s.n < current ? "bg-blue" : "bg-border"}`} />
          )}
        </div>
      ))}
    </div>
  )
}

// ── Step 1: Name & Model ──────────────────────────────────────────────────────

function Step1({
  agentName, model, onNameChange, onModelChange, onNext,
}: {
  agentName: string
  model: ModelId
  onNameChange: (v: string) => void
  onModelChange: (v: ModelId) => void
  onNext: () => void
}) {
  const canProceed = agentName.trim().length >= 2 && agentName.trim().length <= 24

  return (
    <>
      <div className="px-7 py-6 flex flex-col gap-5 max-h-[60vh] overflow-y-auto">
        <div>
          <h3 className="font-heading font-semibold text-text-base mb-1">Name Your BirdBot</h3>
          <p className="text-text-dim text-sm font-sans">Give your agent a name and choose its AI brain.</p>
        </div>

        {/* Name input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold font-sans text-text-dim uppercase tracking-wide">
            Agent name (2–24 characters)
          </label>
          <input
            type="text"
            value={agentName}
            onChange={(e) => onNameChange(e.target.value)}
            maxLength={24}
            placeholder="e.g. Chirpy, Atlas, Max…"
            className="px-4 py-3 rounded-xl bg-depth border border-border text-text-base placeholder:text-text-muted font-sans text-sm focus:outline-none focus:border-blue-light transition-colors"
          />
        </div>

        {/* Model list */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold font-sans text-text-dim uppercase tracking-wide">
            AI Model
          </label>
          <div className="flex flex-col gap-2">
            {MODELS.map((m) => (
              <button
                key={m.id}
                disabled={!m.free}
                onClick={() => m.free && onModelChange(m.id)}
                className={`relative flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                  model === m.id
                    ? "border-blue/50 bg-blue/8"
                    : m.free
                    ? "border-border bg-depth hover:border-blue/30 hover:bg-panel cursor-pointer"
                    : "border-border bg-depth opacity-45 cursor-default"
                }`}
              >
                <div className="w-9 h-9 rounded-lg bg-panel flex items-center justify-center text-lg flex-shrink-0">
                  {m.id === "kimi-k2.5" ? "⚡"
                    : m.id === "gpt-4o" ? "🤖"
                    : m.id === "claude-sonnet-4" ? "✦"
                    : m.id === "claude-opus-4" ? "✦✦"
                    : m.id === "gemini-2.5-pro" ? "💎"
                    : "🧠"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-heading font-semibold text-sm text-text-base">{m.name}</div>
                  <div className="text-xs text-text-muted font-sans">{m.provider}</div>
                  <div className="text-xs text-text-dim font-sans mt-0.5">{m.desc}</div>
                </div>
                {/* IQ bar */}
                <div className="w-20 flex-shrink-0">
                  <div className="flex justify-between text-[10px] text-text-muted mb-1">
                    <span>IQ</span>
                    <span style={{ color: m.free ? "#4ade80" : "#f59e0b" }}>{m.iq}</span>
                  </div>
                  <div className="h-1 bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${m.iq}%`,
                        background: m.free
                          ? "linear-gradient(90deg,#166534,#4ade80)"
                          : "linear-gradient(90deg,#b45309,#f59e0b)",
                      }}
                    />
                  </div>
                </div>
                {/* Badge */}
                <div
                  className="absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded"
                  style={
                    m.free
                      ? { background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)", color: "#4ade80" }
                      : { background: "linear-gradient(135deg,#92400e,#d97706)", color: "#fef3c7" }
                  }
                >
                  {m.free ? "FREE" : "PRO"}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between px-7 py-4 border-t border-border bg-depth/60">
        <span className="text-xs text-text-muted font-sans italic">Upgrade to PRO to unlock all models</span>
        <button
          disabled={!canProceed}
          onClick={onNext}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold font-sans bg-blue text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-light transition-colors"
        >
          Next →
        </button>
      </div>
    </>
  )
}

// ── Step 2: Personality ───────────────────────────────────────────────────────

function Step2({
  traits, total, onTraitsChange, onBack, onNext,
}: {
  traits: Traits
  total: number
  onTraitsChange: (t: Traits) => void
  onBack: () => void
  onNext: () => void
}) {
  const remaining = TOTAL_POINTS - total
  const canProceed = total >= MIN_POINTS_TO_PROCEED

  function handleSlider(key: keyof Traits, rawValue: number) {
    const othersTotal = TRAIT_KEYS.reduce((s, k) => k === key ? s : s + traits[k], 0)
    const capped = Math.min(rawValue, TOTAL_POINTS - othersTotal)
    onTraitsChange({ ...traits, [key]: capped })
  }

  return (
    <>
      <div className="px-7 py-6 flex flex-col gap-4">
        <div>
          <h3 className="font-heading font-semibold text-text-base mb-1">Personality</h3>
          <p className="text-text-dim text-sm font-sans">Each trait is 0–100. Distribute your 400 points across all 8 traits.</p>
        </div>

        {/* Budget bar */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-depth border border-border">
          <span className="text-xs font-medium font-sans text-text-dim whitespace-nowrap">Points remaining</span>
          <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${(remaining / TOTAL_POINTS) * 100}%`,
                background: remaining === 0
                  ? "linear-gradient(90deg,#166534,#4ade80)"
                  : remaining < 40
                  ? "linear-gradient(90deg,#c2410c,#fb923c)"
                  : "linear-gradient(90deg,#2563eb,#60a5fa)",
              }}
            />
          </div>
          <span
            className="text-lg font-black font-sans min-w-[3rem] text-right tabular-nums"
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
          <p className="text-xs text-red-400 font-sans">Allocate at least {MIN_POINTS_TO_PROCEED} points to continue.</p>
        )}
      </div>

      <div className="flex items-center justify-between px-7 py-4 border-t border-border bg-depth/60">
        <button onClick={onBack} className="px-5 py-2.5 rounded-xl text-sm font-semibold font-sans border border-border text-text-dim hover:text-text-base hover:border-border/80 transition-colors">
          ← Back
        </button>
        <button
          disabled={!canProceed}
          onClick={onNext}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold font-sans bg-blue text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-light transition-colors"
        >
          Next →
        </button>
      </div>
    </>
  )
}

function TraitSlider({
  label, value, onChange,
}: {
  label: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-semibold font-sans text-text-dim w-24 flex-shrink-0">{label}</span>
      <div className="relative flex-1 h-5 flex items-center">
        {/* Track background */}
        <div className="absolute inset-x-0 h-1.5 bg-border rounded-full" />
        {/* Fill */}
        <div
          className="absolute left-0 h-1.5 rounded-full pointer-events-none"
          style={{
            width: `${value}%`,
            background: "linear-gradient(90deg,#2563eb,#60a5fa)",
          }}
        />
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="absolute inset-x-0 w-full h-5 opacity-0 cursor-pointer"
          style={{ zIndex: 2 }}
        />
        {/* Thumb */}
        <div
          className="absolute h-4 w-4 rounded-full bg-blue border-2 border-blue-bright pointer-events-none shadow-[0_0_8px_rgba(37,99,235,0.5)]"
          style={{ left: `calc(${value}% - 8px)`, zIndex: 1 }}
        />
      </div>
      <span className="text-sm font-bold font-sans text-gold w-8 text-right tabular-nums">{value}</span>
    </div>
  )
}

// ── Step 3: Focus Areas ───────────────────────────────────────────────────────

function Step3({
  focusAreas, onFocusChange, onBack, onNext,
}: {
  focusAreas: FocusId[]
  onFocusChange: (v: FocusId[]) => void
  onBack: () => void
  onNext: () => void
}) {
  function toggle(id: FocusId) {
    onFocusChange(
      focusAreas.includes(id)
        ? focusAreas.filter((f) => f !== id)
        : [...focusAreas, id]
    )
  }

  return (
    <>
      <div className="px-7 py-6 flex flex-col gap-4">
        <div>
          <h3 className="font-heading font-semibold text-text-base mb-1">Focus Areas</h3>
          <p className="text-text-dim text-sm font-sans">What should your agent prioritize? Pick at least one. <span className="text-text-muted">Integrations come later.</span></p>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {FOCUS_AREAS.map((f) => {
            const selected = focusAreas.includes(f.id)
            return (
              <button
                key={f.id}
                onClick={() => toggle(f.id)}
                className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-[11px] font-semibold font-sans transition-all ${
                  selected
                    ? "border-blue/50 bg-blue/10 text-blue-bright"
                    : "border-border bg-depth text-text-muted hover:border-blue/30 hover:text-text-dim"
                }`}
              >
                <span className="text-xl">{f.icon}</span>
                {f.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex items-center justify-between px-7 py-4 border-t border-border bg-depth/60">
        <button onClick={onBack} className="px-5 py-2.5 rounded-xl text-sm font-semibold font-sans border border-border text-text-dim hover:text-text-base transition-colors">
          ← Back
        </button>
        <button
          disabled={focusAreas.length === 0}
          onClick={onNext}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold font-sans bg-blue text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-light transition-colors"
        >
          Next →
        </button>
      </div>
    </>
  )
}

// ── Step 4: Channels ──────────────────────────────────────────────────────────

function Step4({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  return (
    <>
      <div className="px-7 py-6 flex flex-col gap-4">
        <div>
          <h3 className="font-heading font-semibold text-text-base mb-1">Channels</h3>
          <p className="text-text-dim text-sm font-sans">Where should your agent live? More channels coming soon.</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {CHANNELS.map((c) => (
            <div
              key={c.id}
              className={`relative flex flex-col items-center gap-1.5 py-4 px-2 rounded-xl border text-[11px] font-semibold font-sans ${
                c.available
                  ? "border-blue/50 bg-blue/10 text-blue-bright"
                  : "border-border bg-depth text-text-muted opacity-35"
              }`}
            >
              <span className="text-xl">{c.icon}</span>
              {c.label}
              {!c.available && (
                <span className="absolute top-1.5 right-1.5 text-[8px] text-text-muted font-bold bg-panel px-1 py-0.5 rounded uppercase tracking-wide">
                  Soon
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between px-7 py-4 border-t border-border bg-depth/60">
        <button onClick={onBack} className="px-5 py-2.5 rounded-xl text-sm font-semibold font-sans border border-border text-text-dim hover:text-text-base transition-colors">
          ← Back
        </button>
        <button
          onClick={onNext}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold font-sans bg-blue text-white hover:bg-blue-light transition-colors"
        >
          Next →
        </button>
      </div>
    </>
  )
}

// ── Summary ───────────────────────────────────────────────────────────────────

function StepSummary({
  agentName, model, traits, focusAreas,
  deploying, deployError, onBack, onDeploy,
}: {
  agentName: string
  model: string
  traits: Traits
  focusAreas: FocusId[]
  deploying: boolean
  deployError: string
  onBack: () => void
  onDeploy: () => void
}) {
  const modelInfo = MODELS.find((m) => m.id === model)
  const topTraits = TRAIT_KEYS
    .map((k) => ({ key: k, val: traits[k] }))
    .filter((t) => t.val > 0)
    .sort((a, b) => b.val - a.val)
    .slice(0, 4)
  const focusLabels = focusAreas
    .map((id) => FOCUS_AREAS.find((f) => f.id === id)?.label ?? id)

  return (
    <>
      <div className="px-7 py-6 flex flex-col gap-4">
        <div>
          <h3 className="font-heading font-semibold text-text-base mb-1">Review & Deploy</h3>
          <p className="text-text-dim text-sm font-sans">Here&apos;s a summary of your BirdBot before we launch it.</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SummaryCard title="🧠 Brain">
            <p className="text-sm font-semibold text-text-base">{agentName}</p>
            <p className="text-xs text-text-dim">{modelInfo?.name} (IQ {modelInfo?.iq})</p>
            <p className="text-[11px] text-text-muted mt-1">{modelInfo?.provider}</p>
          </SummaryCard>
          <SummaryCard title="🎭 Personality">
            {topTraits.length > 0
              ? topTraits.map((t) => (
                  <p key={t.key} className="text-xs text-text-dim">
                    {TRAIT_LABELS[t.key]} · <span className="text-text-base font-semibold">{t.val}</span>
                  </p>
                ))
              : <p className="text-xs text-text-muted">No traits set</p>}
          </SummaryCard>
          <SummaryCard title="🎯 Focus Areas">
            {focusLabels.map((l) => (
              <p key={l} className="text-xs text-text-dim">{l}</p>
            ))}
          </SummaryCard>
          <SummaryCard title="📡 Channels">
            <p className="text-sm font-semibold text-text-base">Web Chat</p>
            <p className="text-[11px] text-text-muted mt-1">More channels coming soon</p>
          </SummaryCard>
        </div>
        {deployError && (
          <p className="text-xs text-red-400 font-sans">{deployError}</p>
        )}
      </div>

      <div className="flex items-center justify-between px-7 py-4 border-t border-border bg-depth/60">
        <button onClick={onBack} disabled={deploying} className="px-5 py-2.5 rounded-xl text-sm font-semibold font-sans border border-border text-text-dim hover:text-text-base transition-colors disabled:opacity-40">
          ← Back
        </button>
        <button
          onClick={onDeploy}
          disabled={deploying}
          className="px-6 py-2.5 rounded-xl text-sm font-bold font-sans text-amber-100 disabled:opacity-60 disabled:cursor-wait transition-colors"
          style={{ background: deploying ? "#78350f" : "linear-gradient(135deg,#92400e,#d97706)" }}
        >
          {deploying ? "Deploying…" : `🚀 Deploy ${agentName}`}
        </button>
      </div>
    </>
  )
}

function SummaryCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-depth border border-border rounded-xl p-4 flex flex-col gap-1">
      <p className="text-[10px] font-bold font-sans text-text-muted uppercase tracking-widest mb-1">{title}</p>
      {children}
    </div>
  )
}

// ── Success ───────────────────────────────────────────────────────────────────

function StepSuccess({ agentName }: { agentName: string }) {
  return (
    <div className="flex flex-col items-center gap-5 py-12 px-7 text-center">
      <span className="text-5xl animate-float select-none">🐦</span>
      <div>
        <h3 className="font-heading font-black text-2xl text-text-base mb-2">
          {agentName} is hatching!
        </h3>
        <p className="text-text-dim font-sans text-sm max-w-sm">
          Your BirdBot is being set up. We&apos;ll send you an email the moment it&apos;s live — usually within a few minutes.
        </p>
      </div>
      <div className="px-5 py-4 rounded-xl bg-gold/8 border border-gold/20 text-left max-w-sm w-full">
        <p className="text-xs font-bold text-gold mb-1.5">What happens next</p>
        <p className="text-xs text-text-muted font-sans leading-relaxed">
          We&apos;ll provision your agent and notify you at your registered email when it&apos;s ready to chat. You&apos;ll be able to access it from your dashboard once it&apos;s live.
        </p>
      </div>
    </div>
  )
}
