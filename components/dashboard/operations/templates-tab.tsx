"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Loader2, Share2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { SmartLinkGenerator } from "@/components/workflow/smart-link-generator";

export function TemplatesTab() {
    const [templates, setTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const router = useRouter();
    const [smartLinkDetails, setSmartLinkDetails] = useState<{ instanceId: string, templateId: string } | null>(null);

    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                const res = await fetch("/api/workflow-templates?active=true");
                if (res.ok) {
                    const response = await res.json();
                    setTemplates(response.data || []);
                }
            } catch (error) {
                console.error(error);
                toast.error("Failed to load templates");
            } finally {
                setLoading(false);
            }
        };
        fetchTemplates();
    }, []);

    const createInstance = async (templateId: string) => {
        const branchId = "00000000-0000-0000-0000-000000000000"; // Placeholder
        const res = await fetch("/api/workflows/execute", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ templateId, branchId })
        });
        if (!res.ok) throw new Error("Failed to create workflow instance");
        return await res.json();
    };

    const handleStart = async (templateId: string) => {
        setProcessingId(templateId);
        try {
            const execution = await createInstance(templateId);
            router.push(`/dashboard/workflows/${execution.id}/execute`);
        } catch (error) {
            console.error(error);
            toast.error("Failed to start workflow");
        } finally {
            setProcessingId(null);
        }
    };

    const handleShare = async (templateId: string) => {
        setProcessingId(templateId);
        try {
            const execution = await createInstance(templateId);
            setSmartLinkDetails({ instanceId: execution.id, templateId });
        } catch (error) {
            console.error(error);
            toast.error("Failed to prepare share link");
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map((t) => (
                    <Card key={t.id} className="hover:shadow-md transition-shadow">
                        <CardHeader>
                            <CardTitle>{t.title}</CardTitle>
                            <CardDescription>{t.description || "No description"}</CardDescription>
                        </CardHeader>
                        <CardFooter className="flex gap-2">
                            <Button variant="outline" className="flex-1" onClick={() => handleShare(t.id)} disabled={processingId === t.id}>
                                {processingId === t.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Share2 className="mr-2 h-4 w-4" />}
                                Share
                            </Button>
                            <Button className="flex-1" onClick={() => handleStart(t.id)} disabled={processingId === t.id}>
                                {processingId === t.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                                Start
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
            {templates.length === 0 && (
                <div className="text-center text-muted-foreground py-12">No active workflows found.</div>
            )}
            {smartLinkDetails && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-background rounded-lg border shadow-xl w-full max-w-md relative overflow-hidden">
                        <div className="flex justify-between items-center p-4 border-b bg-muted/50">
                            <h3 className="text-lg font-semibold">Share Workflow</h3>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setSmartLinkDetails(null)}>
                                <span className="sr-only">Close</span>
                                <span aria-hidden="true">&times;</span>
                            </Button>
                        </div>
                        <div className="p-6">
                            <SmartLinkGenerator instanceId={smartLinkDetails.instanceId} templateId={smartLinkDetails.templateId} />
                            <p className="text-sm text-muted-foreground mt-4 text-center">Use this link for mobile or external completion.</p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
