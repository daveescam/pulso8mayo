"use client"

import { Button } from "@/components/ui/button"
import { useState } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { authClient } from "@/lib/auth-client"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle } from "lucide-react"

function isDevMode(): boolean {
  if (typeof window === "undefined") return false
  return process.env.NODE_ENV === "development" || localStorage.getItem("pulso_dev_mode") === "true"
}

export default function TestWorkflowPage() {
  const { data: session } = authClient.useSession()
  const isDev = isDevMode()

  if (!isDev) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-xl font-bold">Página no disponible</h3>
        <p className="text-muted-foreground max-w-md mt-2">
          Esta página de pruebas solo está disponible en modo desarrollo.
        </p>
        <p className="text-xs text-muted-foreground mt-4">
          Establece <code className="bg-muted px-1 py-0.5 rounded text-xs">localStorage.setItem(&quot;pulso_dev_mode&quot;, &quot;true&quot;)</code> para habilitar.
        </p>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-2">
        <Badge variant="destructive">DEV ONLY</Badge>
        <h1 className="text-2xl font-bold">Workflow Test Panel</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        Herramientas de prueba para desarrollo. No visible en producción.
      </p>

      <IncidentEscalationCard />
      <AIVerificationCard />
      <RoleAssignmentCard branchId={(session?.user as any)?.branchId} />
    </div>
  )
}

function IncidentEscalationCard() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const triggerWorkflow = async () => {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch("/api/test-workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          incidentId: crypto.randomUUID(),
          chain: [
            { level: 1, triggerAfterMinutes: 0, message: "Level 1 Escalation" },
            { level: 2, triggerAfterMinutes: 0.1, message: "Level 2 Escalation (Delayed)" }
          ]
        })
      })
      const data = await res.json()
      setResult(data)
      if (res.ok) {
        toast.success("Workflow triggered successfully!")
      } else {
        toast.error(`Failed: ${data.error || "Unknown error"}`)
      }
    } catch (e: any) {
      toast.error(`Connection error: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Test Incident Escalation Workflow</CardTitle>
        <CardDescription>
          Simula una escalación de incidente en el backend.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={triggerWorkflow} disabled={loading} className="w-full">
          {loading ? "Triggering..." : "Trigger Workflow Now"}
        </Button>
        {result && (
          <pre className={`p-4 rounded text-xs overflow-auto ${result.success ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
            {JSON.stringify(result, null, 2)}
          </pre>
        )}
      </CardContent>
    </Card>
  )
}

function AIVerificationCard() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const testAI = async () => {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch("/api/test-ai", {
        method: "POST",
        body: JSON.stringify({ prompt: "Describe this image in detail." })
      })
      const data = await res.json()
      setResult(data)
      if (data.success) toast.success("AI Verification Successful")
      else toast.error("AI Verification Failed")
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Test AI Verification (Moondream)</CardTitle>
        <CardDescription>
          Prueba la conexión al API de Moondream con una imagen de ejemplo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={testAI} disabled={loading} variant="secondary" className="w-full">
          {loading ? "Analyzing..." : "Test AI Connection"}
        </Button>
        {result && (
          <pre className={`p-4 rounded text-xs overflow-auto max-h-60 mt-4 ${result.success ? "bg-blue-50 text-blue-800" : "bg-red-50 text-red-800"}`}>
            {JSON.stringify(result, null, 2)}
          </pre>
        )}
      </CardContent>
    </Card>
  )
}

function RoleAssignmentCard({ branchId }: { branchId?: string }) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [role, setRole] = useState("EMPLEADO")

  const testAssignment = async () => {
    if (!branchId) {
      toast.error("No Branch ID found. Are you logged in?")
      return
    }
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch("/api/test-assignment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branchId, role, type: "ROLE" })
      })
      const data = await res.json()
      setResult(data)
      if (data.success) toast.success(`Assigned to: ${data.assignedUser?.name || "Unknown"}`)
      else toast.error("Assignment Failed")
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Test Role Assignment</CardTitle>
        <CardDescription>
          Verifica la asignación de usuario basada en rol o auto-balanceo.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Branch: {branchId || "Loading..."}
        </p>
        <div className="flex gap-2">
          <select
            className="border rounded p-2 text-sm"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="EMPLEADO">Empleado</option>
            <option value="GERENTE">Gerente</option>
            <option value="SUPERVISOR">Supervisor</option>
          </select>
          <Button onClick={testAssignment} disabled={loading} variant="outline" className="flex-1">
            {loading ? "Testing..." : "Test Assignment Logic"}
          </Button>
        </div>
        {result && (
          <pre className={`p-4 rounded text-xs overflow-auto max-h-60 ${result.success ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
            {JSON.stringify(result, null, 2)}
          </pre>
        )}
      </CardContent>
    </Card>
  )
}
