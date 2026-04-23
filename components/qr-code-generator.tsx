"use client";

import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Download } from "lucide-react";
import { toast } from "sonner";
import { useRef } from "react";

interface QRCodeGeneratorProps {
    value: string;
    title?: string;
    description?: string;
    includeDownload?: boolean;
    filename?: string;
}

export function QRCodeGenerator({
    value,
    title = "Código QR",
    description,
    includeDownload = true,
    filename = "qr-code"
}: QRCodeGeneratorProps) {
    const qrRef = useRef<HTMLDivElement>(null);

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(value);
            toast.success("Link copiado al portapapeles");
        } catch (error) {
            toast.error("Error al copiar el link");
        }
    };

    const downloadQR = () => {
        if (!qrRef.current) return;

        const svg = qrRef.current.querySelector("svg");
        if (!svg) return;

        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();

        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx?.drawImage(img, 0, 0);
            const pngFile = canvas.toDataURL("image/png");

            const downloadLink = document.createElement("a");
            downloadLink.download = `${filename}.png`;
            downloadLink.href = pngFile;
            downloadLink.click();

            toast.success("QR code descargado");
        };

        img.src = "data:image/svg+xml;base64," + btoa(svgData);
    };

    return (
        <Card className="bg-muted/50 border-dashed">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    {title}
                </CardTitle>
                {description && (
                    <CardDescription>{description}</CardDescription>
                )}
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="bg-white p-4 rounded-lg border space-y-2">
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-muted-foreground">Smart Link</span>
                        <Button size="sm" variant="outline" onClick={copyToClipboard}>
                            <Copy className="h-3 w-3 mr-1" />
                            Copiar
                        </Button>
                    </div>
                    <code className="text-xs block p-2 font-mono text-muted-foreground bg-gray-50 rounded border break-all">
                        {value}
                    </code>
                </div>

                <div className="flex justify-center p-4 bg-white rounded-lg border" ref={qrRef}>
                    <QRCodeSVG
                        value={value}
                        size={200}
                        level="H"
                        includeMargin={true}
                        style={{ width: "200px", height: "200px" }}
                    />
                </div>

                {includeDownload && (
                    <div className="flex justify-center">
                        <Button onClick={downloadQR} variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Descargar QR
                        </Button>
                    </div>
                )}

                <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded">
                    <p className="font-medium mb-1">¿Cómo funciona?</p>
                    <p>Los usuarios que escaneen este código QR o usen el smart link serán redirigidos a un formulario de registro. Al completarlo, se asignarán automáticamente como <strong>EMPLEADO</strong> de esta sucursal.</p>
                </div>
            </CardContent>
        </Card>
    );
}
