import { useQuery } from "@tanstack/react-query"

export function useWorkflows() {
  return useQuery({
    queryKey: ["workflows"],
    queryFn: async () => {
      const res = await fetch("/api/workflows")
      if (!res.ok) throw new Error("Failed to fetch workflows")
      return res.json()
    },
    staleTime: 30 * 1000,
  })
}

export function useWorkflowExecution(id: string) {
  return useQuery({
    queryKey: ["workflow-execution", id],
    queryFn: async () => {
      const res = await fetch(`/api/workflows/executions/${id}`)
      if (!res.ok) throw new Error("Failed to fetch workflow execution")
      return res.json()
    },
    enabled: !!id,
  })
}
