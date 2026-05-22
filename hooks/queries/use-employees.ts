import { useQuery } from "@tanstack/react-query"

export function useEmployees(params?: Record<string, string>) {
  return useQuery({
    queryKey: ["employees", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams(params)
      const res = await fetch(`/api/employees?${searchParams}`)
      if (!res.ok) throw new Error("Failed to fetch employees")
      return res.json()
    },
    staleTime: 60 * 1000,
  })
}

export function useEmployee(id: string) {
  return useQuery({
    queryKey: ["employee", id],
    queryFn: async () => {
      const res = await fetch(`/api/employees/${id}`)
      if (!res.ok) throw new Error("Failed to fetch employee")
      return res.json()
    },
    enabled: !!id,
  })
}
