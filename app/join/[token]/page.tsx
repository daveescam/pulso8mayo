"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function JoinPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [branchInfo, setBranchInfo] = useState<{ branchName: string; companyName: string } | null>(null);
    const [error, setError] = useState("");

    // Form state
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    useEffect(() => {
        // Pre-fill email from query param if exists
        const emailParam = searchParams.get("email");
        if (emailParam) setEmail(emailParam);

        // Fetch branch info from token
        async function fetchBranchInfo() {
            try {
                const token = params?.token;
                if (!token) return;

                const res = await fetch(`/api/join/info?token=${token}`);
                if (!res.ok) {
                    setError("Enlace de invitación inválido");
                    return;
                }

                const data = await res.json();
                setBranchInfo(data.data);
            } catch (err) {
                console.error(err);
                setError("Error al verificar la invitación");
            }
        }
        fetchBranchInfo();
    }, [params, searchParams]);

    const handleJoin = async () => {
        setLoading(true);
        try {
            // 1. Sign Up
            // We need to pass the inviteToken to the sign-up flow.
            // Better Auth supports additional fields? Or we create user then assign?
            // Or we use a custom API for "join" that wraps sign-up.

            // Custom API Approach: /api/join
            const token = params?.token;
            console.log('Join Page - Token from params:', token);
            console.log('Join Page - Token type:', typeof token);

            const res = await fetch("/api/join", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    email,
                    password,
                    inviteToken: token
                })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "Failed to join");
            }

            const joinData = await res.json();

            if (joinData.data?.existing) {
                // User already exists, redirect to sign-in
                toast.success("Tu cuenta ha sido vinculada a la sucursal. Por favor inicia sesión.");
                router.push("/sign-in");
            } else {
                // New user, auto sign-in
                await authClient.signIn.email({
                    email,
                    password,
                    fetchOptions: {
                        onSuccess: () => router.push("/dashboard"),
                    }
                });
            }

        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-red-600">Error</CardTitle>
                        <CardDescription>{error}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={() => router.push("/sign-in")}>
                            Ir al inicio de sesión
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!branchInfo) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Únete al equipo</CardTitle>
                    <CardDescription>
                        Has sido invitado a unirte como gerente de{" "}
                        <strong>{branchInfo.branchName}</strong>
                        {branchInfo.companyName && ` en ${branchInfo.companyName}`}.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Nombre Completo</Label>
                        <Input value={name} onChange={e => setName(e.target.value)} placeholder="Tu nombre" />
                    </div>
                    <div className="space-y-2">
                        <Label>Correo Electrónico</Label>
                        <Input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="tu@email.com" />
                    </div>
                    <div className="space-y-2">
                        <Label>Contraseña</Label>
                        <Input value={password} onChange={e => setPassword(e.target.value)} type="password" />
                    </div>

                    <Button className="w-full" onClick={handleJoin} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Registrarse y Unirse
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
