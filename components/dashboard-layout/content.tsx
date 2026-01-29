import DashboardContent from "@/components/dashboard"
import type { ReactNode } from "react"

interface ContentProps {
  children?: ReactNode
}

export default function Content({ children }: ContentProps) {
  // If children are provided, render them (for custom pages like settings)
  // Otherwise, render the default dashboard content
  return (
    <div className="space-y-4">
      {children || <DashboardContent />}
    </div>
  )
}
