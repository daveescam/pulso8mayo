import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

export function useInventory(branchId?: string) {
  return useQuery({
    queryKey: ["inventory", branchId],
    queryFn: async () => {
      const url = branchId
        ? `/api/inventory/products?branchId=${branchId}`
        : "/api/inventory/products"
      const res = await fetch(url)
      if (!res.ok) throw new Error("Failed to fetch products")
      return res.json()
    },
    staleTime: 30 * 1000,
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await fetch("/api/inventory/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Error al crear producto")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] })
    },
  })
}
