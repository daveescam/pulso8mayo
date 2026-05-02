import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
    // Use empty baseURL so better-auth defaults to the current window.location.origin
    // This prevents port mismatch issues (e.g., dev server on :3001 but env says :3000)
    // In production, the origin is always correct automatically
})
