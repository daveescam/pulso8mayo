import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { StockCountService, DEFAULT_CATEGORIES } from "@/lib/services/stock-count-service";
import { db } from "@/lib/db";
import { branches } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, History } from "lucide-react";

export default async function StockCountPage() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) redirect("/auth/login");

    const companyId = session.user.companyId || "";

    const userBranches = await db.select().from(branches)
        .where(eq(branches.companyId, companyId));

    const history = await StockCountService.getStockCountHistory(companyId);

    const formatDate = (date: Date | null | undefined) => {
        if (!date) return "En progreso";
        return new Date(date).toLocaleDateString("es-MX", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <div className="container mx-auto py-8 max-w-2xl space-y-8">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <ClipboardList className="h-6 w-6" />
                    Conteo de Inventario
                </h1>
                <p className="text-muted-foreground mt-1">
                    Inicia un conteo físico de inventario por categoría
                </p>
            </div>

            {userBranches.length === 0 ? (
                <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                        No hay sucursales configuradas. Configura una sucursal para iniciar el conteo.
                    </CardContent>
                </Card>
            ) : (
                <>
                    <Card>
                        <CardHeader>
                            <CardTitle>Nuevo Conteo</CardTitle>
                            <CardDescription>
                                Selecciona la categoría y sucursal para iniciar el conteo físico
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form action={async (formData) => {
                                "use server";
                                const branchId = formData.get("branchId");
                                const category = formData.get("category");
                                const res = await fetch(process.env.NEXT_PUBLIC_APP_URL + "/api/inventory/stock-count", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ branchId, category }),
                                });
            const result = await res.json();
            if (result.instance?.id) {
              redirect(`/dashboard/workflows/${result.instance.id}/execute`);
            }
            if (result.error) {
              const activeIdMatch = result.error.match(/ID:\s*([a-f0-9-]+)/i);
              if (activeIdMatch) {
                redirect(`/dashboard/workflows/${activeIdMatch[1]}/execute`);
              }
              console.error(result.error);
            }
                            }}>
                                <div className="grid gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="branchId">Sucursal</Label>
                                        <select
                                            id="branchId"
                                            name="branchId"
                                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                            required
                                        >
                                            {userBranches.map(branch => (
                                                <option key={branch.id} value={branch.id}>
                                                    {branch.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="category">Categoría</Label>
                                        <select
                                            id="category"
                                            name="category"
                                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                            required
                                        >
                                            {DEFAULT_CATEGORIES.map(c => (
                                                <option key={c.id} value={c.value}>
                                                    {c.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <Button type="submit" className="w-full mt-2">
                                        Iniciar Conteo
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {history.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <History className="h-5 w-5" />
                                    Historial de Conteos
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {history.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                                        >
                                            <div className="flex flex-col gap-1">
                                                <div className="font-medium">
                                                    {(item.data as any)?.category || "Conteo de Inventario"}
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    {(item.data as any)?.productCount || 0} productos •{" "}
                                                    {formatDate(item.completedAt)}
                                                </div>
                                            </div>
                                            <Badge variant={item.status === "COMPLETED" ? "default" : "secondary"}>
                                                {item.status === "COMPLETED" ? "Completado" : "En progreso"}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </>
            )}
        </div>
    );
}