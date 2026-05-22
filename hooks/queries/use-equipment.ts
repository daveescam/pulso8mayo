import { useQuery } from "@tanstack/react-query"

export function useEquipment() {
  return useQuery({
    queryKey: ["equipment"],
    queryFn: async () => {
      const res = await fetch("/api/equipment")
      if (!res.ok) throw new Error("Failed to fetch equipment")
      return res.json()
    },
    staleTime: 30 * 1000,
  })
}

export function useEquipmentItem(id: string) {
  return useQuery({
    queryKey: ["equipment", id],
    queryFn: async () => {
      const res = await fetch(`/api/equipment/${id}`)
      if (!res.ok) throw new Error("Failed to fetch equipment item")
      return res.json()
    },
    enabled: !!id,
  })
}
