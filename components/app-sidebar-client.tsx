"use client"

import dynamic from "next/dynamic"
import type { AppSidebarProps } from "@/components/app-sidebar"

const AppSidebar = dynamic(
  () => import("@/components/app-sidebar").then(mod => ({ default: mod.AppSidebar })),
  { ssr: false, loading: () => <div className="hidden" /> }
)

export function AppSidebarClient(props: AppSidebarProps) {
  return <AppSidebar {...props} />
}
