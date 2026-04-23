
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Copy, MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";

interface SmartLinkGeneratorProps {
    instanceId: string; // The workflow instance ID
    templateId: string; // The workflow template ID
    sessionId?: string; // Optional context
    triggerLabel?: string;
    triggerIcon?: React.ReactNode;
}

export function SmartLinkGenerator({ instanceId, templateId, sessionId, triggerLabel = "Send Link", triggerIcon }: SmartLinkGeneratorProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [generatedLink, setGeneratedLink] = useState<string | null>(null);

    const generateLink = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/smart-links/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    instanceId,
                    templateId,
                    sessionId,
                    expiresInMinutes: 1440 // 24 hours
                })
            });

            if (!res.ok) throw new Error("Failed to generate link");

            const data = await res.json();
            setGeneratedLink(data.url);
        } catch (error) {
            console.error(error);
            toast.error("Failed to generate smart link");
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (generatedLink) {
            navigator.clipboard.writeText(generatedLink);
            toast.success("Link copied to clipboard");
        }
    };

    const sendWhatsapp = () => {
        if (generatedLink) {
            const message = `Hola! Aquí tienes tu enlace para el flujo de trabajo: ${generatedLink}`;
            const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
            window.open(url, '_blank');
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    {triggerIcon || <Send className="h-4 w-4" />}
                    {triggerLabel}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Generate Smart Link</DialogTitle>
                    <DialogDescription>
                        Create a unique access link for this workflow. The link will be valid for 24 hours.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col space-y-4 py-4">
                    {!generatedLink ? (
                        <div className="flex justify-center py-8">
                            <Button onClick={generateLink} disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Generate New Link
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center space-x-2">
                                <Input value={generatedLink} readOnly />
                                <Button size="icon" variant="secondary" onClick={copyToClipboard}>
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>

                            <Button className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white" onClick={sendWhatsapp}>
                                <MessageCircle className="mr-2 h-4 w-4" />
                                Send via WhatsApp
                            </Button>

                            <Button variant="ghost" className="w-full" onClick={() => setGeneratedLink(null)}>
                                Generate Another
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
