"use client"

import * as React from "react"
import { ChevronsUpDown, Plus, Building2, Check } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useRouter } from "next/navigation"
import { switchBranch } from "@/app/actions/user"
import { useBranch } from "@/lib/branch-context"
import { toast } from "sonner"

export function NavCompany({
  company = { name: "Loading...", plan: "" },
  branches: propBranches = [],
  currentBranchId: initialBranchId
}: {
  company: {
    name: string
    plan: string
  },
  branches: {
    id: string
    name: string
  }[],
  currentBranchId?: string
}) {
  const { isMobile } = useSidebar()
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()
  const { selectedBranchId, setSelectedBranchId, setBranches } = useBranch()

  // Initialize branches in context
  React.useEffect(() => {
    setBranches(propBranches);
  }, [propBranches, setBranches]);

  // Use context branch ID or fallback to prop
  const activeBranchId = selectedBranchId || initialBranchId;

  const handleBranchSwitch = async (branchId: string) => {
    if (branchId === activeBranchId) return;

    startTransition(async () => {
      try {
        await switchBranch(branchId);
        setSelectedBranchId(branchId);
        toast.success("Sucursal cambiada correctamente");
        router.refresh();
      } catch (error) {
        toast.error("Error al cambiar de sucursal");
        console.error(error);
      }
    });
  }

  const activeBranch = propBranches.find(b => b.id === activeBranchId) || propBranches[0];

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                        >
                            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                                <Building2 className="size-4" />
                            </div>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-semibold">{activeBranch?.name || "Select Branch"}</span>
                                <span className="truncate text-xs">{company.name} ({company.plan})</span>
                            </div>
                            <ChevronsUpDown className="ml-auto" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                        align="start"
                        side={isMobile ? "bottom" : "right"}
                        sideOffset={4}
                    >
                        <DropdownMenuLabel className="text-xs text-muted-foreground">
                            Sucursales
                        </DropdownMenuLabel>
                        {propBranches.map((branch) => (
            <DropdownMenuItem
              key={branch.id}
              onClick={() => handleBranchSwitch(branch.id)}
              className="gap-2 p-2"
            >
              <div className="flex size-6 items-center justify-center rounded-sm border">
                <Building2 className="size-4 shrink-0" />
              </div>
              {branch.name}
              {branch.id === activeBranchId && <Check className="ml-auto size-4" />}
            </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="gap-2 p-2" disabled>
                            <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                                <Plus className="size-4" />
                            </div>
                            <div className="font-medium text-muted-foreground">Add branch</div>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    )
}
