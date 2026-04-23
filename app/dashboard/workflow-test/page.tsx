
"use client"

import { Button } from "@/components/ui/button"
import { useState } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { authClient } from "@/lib/auth-client"

export default function TestWorkflowPage() {
    const { data: session } = authClient.useSession()
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
                toast.error(`Failed to trigger: ${data.error || "Unknown error"}`)
            }
        } catch (e: any) {
            console.error(e)
            toast.error(`Connection error: ${e.message}`)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="p-8 space-y-6 max-w-2xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>Test Incident Escalation Workflow</CardTitle>
                    <CardDescription>
                        Use this to manually trigger the backend workflow.
                        This simulates an incident being escalated.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="bg-slate-50 p-4 rounded text-sm text-slate-600">
                        <p><strong>Workflow:</strong> Incident Escalation</p>
                        <p><strong>Levels:</strong> 2 (Immediate, +6 seconds)</p>
                    </div>

                    <Button onClick={triggerWorkflow} disabled={loading} className="w-full">
                        {loading ? "Triggering..." : "Trigger Workflow Now"}
                    </Button>

                    {result && (
                        <div className="mt-4">
                            <h3 className="text-sm font-semibold mb-2">Response:</h3>
                            <pre className={`p-4 rounded text-xs overflow-auto ${result.success ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
                                {JSON.stringify(result, null, 2)}
                            </pre>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Test AI Verification (Moondream)</CardTitle>
                    <CardDescription>
                        Test the connection to Moondream API using a sample image.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="bg-slate-50 p-4 rounded text-sm text-slate-600">
                        <p><strong>Provider:</strong> Moondream</p>
                        <p><strong>Test Image:</strong> Random Unsplash Image</p>
                    </div>

                    <AITestButton />

                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Test Role Assignment</CardTitle>
                    <CardDescription>
                        Verify that the system can find and assign a user based on Role or Auto-balancing.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-xs text-muted-foreground">
                        Current Branch: {(session?.user as any)?.branchId || "Loading..."}
                    </p>
                    <AssignmentTestButton branchId={(session?.user as any)?.branchId} />
                </CardContent>
            </Card>
        </div>
    )
}

function AssignmentTestButton({ branchId }: { branchId?: string }) {
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<any>(null)
    const [role, setRole] = useState("EMPLEADO")

    const testAssignment = async () => {
        if (!branchId) {
            toast.error("No Branch ID found. Are you logged in?");
            return;
        }

        setLoading(true)
        setResult(null)
        try {
            // Using the actual branchId from the session
            const res = await fetch("/api/test-assignment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    branchId: branchId,
                    role: role,
                    type: "ROLE"
                })
            })
            const data = await res.json()
            setResult(data)

            if (data.success) {
                toast.success(`Assigned to: ${data.assignedUser?.name || "Unknown"}`)
            } else {
                toast.error("Assignment Failed")
            }
        } catch (e: any) {
            toast.error(e.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-4">
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
                <div className="mt-4">
                    <h3 className="text-sm font-semibold mb-2">Assignment Result:</h3>
                    <pre className={`p-4 rounded text-xs overflow-auto max-h-60 ${result.success ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
                        {JSON.stringify(result, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    )
}

function AITestButton() {
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

            if (data.success) {
                toast.success("AI Verification Successful")
            } else {
                toast.error("AI Verification Failed")
            }
        } catch (e: any) {
            toast.error(e.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-4">
            <Button onClick={testAI} disabled={loading} variant="secondary" className="w-full">
                {loading ? "Analyzing..." : "Test AI Connection"}
            </Button>

            {result && (
                <div className="mt-4">
                    <h3 className="text-sm font-semibold mb-2">AI Response:</h3>
                    <pre className={`p-4 rounded text-xs overflow-auto max-h-60 ${result.success ? "bg-blue-50 text-blue-800" : "bg-red-50 text-red-800"}`}>
                        {JSON.stringify(result, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    )
}
