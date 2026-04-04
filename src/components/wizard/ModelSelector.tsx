"use client"

import { MODELS, type ModelId } from "@/types/wizard"

export function ModelSelector({
  value,
  onChange,
}: {
  value: ModelId
  onChange: (v: ModelId) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      {MODELS.map((m) => (
        <button
          key={m.id}
          disabled={!m.free}
          onClick={() => m.free && onChange(m.id)}
          className={`relative flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
            value === m.id
              ? "border-blue/50 cursor-pointer"
              : m.free
              ? "border-border hover:border-blue/30 cursor-pointer"
              : "border-border opacity-45 cursor-default"
          }`}
          style={
            value === m.id
              ? { background: "rgba(37,99,235,0.1)", boxShadow: "inset 0 0 0 1px rgba(37,99,235,0.25)" }
              : { background: "#07091a" }
          }
        >
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,255,255,0.05)" }}>
            <img
              src={
                m.id === "kimi-k2.5"        ? "/kimi.svg"
                : m.id === "gpt-4o"         ? "/chatgpt.svg"
                : m.id === "claude-sonnet-4" ? "/claude.svg"
                : m.id === "claude-opus-4"   ? "/claude.svg"
                : m.id === "gemini-2.5-pro"  ? "/gemini.svg"
                : m.id === "deepseek-r1"     ? "/deepseek.svg"
                : ""
              }
              alt={m.name}
              className="w-5 h-5 object-contain"
            />
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
            <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
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
  )
}
