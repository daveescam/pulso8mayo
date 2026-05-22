import { useQuery } from "@tanstack/react-query"

export function useBranches() {
  return useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const res = await fetch("/api/branches")
      if (!res.ok) throw new Error("Failed to fetch branches")
      const data = await res.json()
      return data.branches || []
    },
    staleTime: 5 * 60 * 1000,
  })
}
