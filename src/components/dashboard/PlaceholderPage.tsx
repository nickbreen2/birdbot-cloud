interface PlaceholderPageProps {
  title: string
  description: string
  icon: string
}

export function PlaceholderPage({ title, description, icon }: PlaceholderPageProps) {
  return (
    <div className="p-8">
      <h1 className="font-heading font-bold text-2xl text-text-base mb-8">{title}</h1>
      <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
        <div className="w-16 h-16 rounded-2xl bg-panel border border-border flex items-center justify-center text-3xl">
          {icon}
        </div>
        <div>
          <h2 className="font-heading font-semibold text-lg text-text-base mb-2">
            Coming Soon
          </h2>
          <p className="text-text-dim text-sm font-sans max-w-sm leading-relaxed">
            {description}
          </p>
        </div>
        <div className="px-4 py-2 rounded-lg bg-blue/10 border border-blue/20 text-blue-bright text-xs font-sans font-medium">
          In development
        </div>
      </div>
    </div>
  )
}
