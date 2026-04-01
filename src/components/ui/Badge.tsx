type Variant = "blue" | "gold" | "green" | "muted"

interface BadgeProps {
  children: React.ReactNode
  variant?: Variant
  className?: string
}

const variantClasses: Record<Variant, string> = {
  blue:  "bg-blue/10 text-blue-bright border border-blue/20",
  gold:  "bg-gold/10 text-gold-light border border-gold/20",
  green: "bg-emerald/10 text-emerald border border-emerald/20",
  muted: "bg-panel text-text-dim border border-border",
}

export function Badge({ children, variant = "blue", className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold font-sans ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  )
}
