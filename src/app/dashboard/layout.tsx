export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-depth flex items-center justify-center">
      {children}
    </div>
  )
}
