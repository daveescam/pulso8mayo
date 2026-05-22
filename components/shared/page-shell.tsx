import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

interface PageShellProps {
  children: ReactNode
  className?: string
}

export function PageShell({ children, className }: PageShellProps) {
  return (
    <div className={cn("flex flex-1 flex-col", className)}>
      <div className="@container/main flex flex-1 flex-col">{children}</div>
    </div>
  )
}
