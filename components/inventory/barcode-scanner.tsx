"use client";

import { useState, useCallback, useRef } from "react";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { BarcodeScanner } from "@capacitor-mlkit/barcode-scanning";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { 
    Camera as CameraIcon, 
    Scan, 
    CheckCircle, 
    AlertCircle, 
    X, 
    Flashlight,
    RefreshCcw
} from "lucide-react";
import { toast } from "sonner";

interface BarcodeScannerProps {
    onScan: (barcode: string) => void;
    onClose: () => void;
}

export function BarcodeScannerComponent({ onScan, onClose }: BarcodeScannerProps) {
    const [isScanning, setIsScanning] = useState(false);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [torchOn, setTorchOn] = useState(false);
    const [lastScanned, setLastScanned] = useState<string>("");
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // Check permissions on mount
    const checkPermissions = useCallback(async () => {
        try {
            const status = await BarcodeScanner.checkPermissions();
            setHasPermission(status.camera === "granted");
        } catch (error) {
            console.error("Permission check error:", error);
            setHasPermission(false);
        }
    }, []);

    // Request permissions
    const requestPermissions = useCallback(async () => {
        try {
            const status = await BarcodeScanner.requestPermissions();
            setHasPermission(status.camera === "granted");
            
            if (status.camera === "granted") {
                startScanning();
            } else {
                toast.error("Permiso de cámara denegado. Por favor, habilita el acceso a la cámara en la configuración de tu dispositivo.");
            }
        } catch (error) {
            console.error("Permission request error:", error);
            toast.error("Error al solicitar permisos de cámara");
        }
    }, []);

    // Start scanning
    const startScanning = useCallback(async () => {
        try {
            setIsScanning(true);
            
            // Check if running in browser (not Capacitor)
            if (typeof navigator !== 'undefined' && 'mediaDevices' in navigator) {
                // Use browser's getUserMedia for web
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment' } // Use back camera
                });
                
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    streamRef.current = stream;
                }
                
                // Start scanning with browser API
                startBrowserScanning();
            } else {
                // Use Capacitor for native apps
                await startCapacitorScanning();
            }
        } catch (error) {
            console.error("Start scanning error:", error);
            toast.error("Error al iniciar la cámara");
            setIsScanning(false);
        }
    }, []);

    // Browser-based scanning using BarcodeDetector API (experimental)
    const startBrowserScanning = useCallback(() => {
        // Note: BarcodeDetector is experimental and not available in all browsers
        // For production, consider using a library like html5-qrcode
        
        if ('BarcodeDetector' in window) {
            const barcodeDetector = new (window as any).BarcodeDetector({
                formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'qr_code']
            });

            const detectBarcode = async () => {
                if (videoRef.current && isScanning) {
                    try {
                        const barcodes = await barcodeDetector.detect(videoRef.current);
                        if (barcodes.length > 0) {
                            handleBarcodeDetected(barcodes[0].rawValue);
                        }
                    } catch (error) {
                        console.error("Detection error:", error);
                    }
                    
                    // Continue scanning
                    requestAnimationFrame(detectBarcode);
                }
            };

            detectBarcode();
        } else {
            // Fallback: Use html5-qrcode library or show message
            toast.info("Tu navegador no soporta detección automática. Usa un dispositivo móvil o ingresa el código manualmente.");
        }
    }, [isScanning]);

    // Capacitor-based scanning (for native apps)
    const startCapacitorScanning = useCallback(async () => {
        try {
            await BarcodeScanner.startScan();
            
            const listener = await BarcodeScanner.addListener('barcodeScanned', async (event) => {
                handleBarcodeDetected(event.barcode.rawValue);
            });

            // Store listener for cleanup
            return () => listener.remove();
        } catch (error) {
            console.error("Capacitor scanning error:", error);
            throw error;
        }
    }, []);

    // Handle barcode detected
    const handleBarcodeDetected = useCallback((value: string) => {
        if (value && value !== lastScanned) {
            setLastScanned(value);
            toast.success(`Código escaneado: ${value}`);
            onScan(value);
            
            // Stop scanning after successful scan
            stopScanning();
        }
    }, [lastScanned, onScan]);

    // Stop scanning
    const stopScanning = useCallback(() => {
        setIsScanning(false);
        
        // Stop browser camera stream
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        
        // Stop Capacitor scanning
        BarcodeScanner.stopScan().catch(console.error);
    }, []);

    // Toggle flashlight
    const toggleTorch = useCallback(async () => {
        try {
            if (typeof navigator !== 'undefined' && 'mediaDevices' in navigator) {
                // Browser doesn't support torch control easily
                toast.info("Control de flash no disponible en navegador");
                return;
            }
            
            await BarcodeScanner.toggleTorch();
            setTorchOn(!torchOn);
        } catch (error) {
            console.error("Torch toggle error:", error);
        }
    }, [torchOn]);

    // Cleanup on unmount
    useState(() => {
        checkPermissions();
        
        return () => {
            stopScanning();
        };
    });

    return (
        <DialogContent className="max-w-md">
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                    <Scan className="w-5 h-5" />
                    Escanear Código de Barras
                </DialogTitle>
                <DialogDescription>
                    Apunta la cámara hacia el código de barras para escanearlo
                </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
                {/* Camera View */}
                <Card>
                    <CardContent className="p-0 relative aspect-square bg-black rounded-lg overflow-hidden">
                        {isScanning ? (
                            <>
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="w-full h-full object-cover"
                                />
                                {/* Scanning overlay */}
                                <div className="absolute inset-0 border-2 border-primary/50 rounded-lg">
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-primary rounded-lg">
                                        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary" />
                                        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary" />
                                        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary" />
                                        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary" />
                                    </div>
                                </div>
                                
                                {/* Controls */}
                                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                                    <Button
                                        size="icon"
                                        variant="secondary"
                                        onClick={toggleTorch}
                                        className="rounded-full"
                                    >
                                        <Flashlight className="w-5 h-5" />
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="destructive"
                                        onClick={stopScanning}
                                        className="rounded-full"
                                    >
                                        <X className="w-5 h-5" />
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-white p-8">
                                <CameraIcon className="w-16 h-16 mb-4 opacity-50" />
                                <p className="text-center text-sm mb-4">
                                    {hasPermission === false 
                                        ? "Permiso de cámara denegado"
                                        : "Presiona iniciar para escanear"
                                    }
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Last scanned */}
                {lastScanned && (
                    <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                            Último código escaneado: <strong>{lastScanned}</strong>
                        </AlertDescription>
                    </Alert>
                )}

                {/* Permissions warning */}
                {hasPermission === false && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            Se requiere permiso de cámara para escanear códigos de barras.
                        </AlertDescription>
                    </Alert>
                )}
            </div>

            <DialogFooter className="gap-2">
                {!isScanning ? (
                    hasPermission === false ? (
                        <Button onClick={requestPermissions} className="gap-2">
                            <CameraIcon className="w-4 h-4" />
                            Solicitar Permiso
                        </Button>
                    ) : (
                        <Button onClick={startScanning} className="gap-2">
                            <Scan className="w-4 h-4" />
                            Iniciar Escaneo
                        </Button>
                    )
                ) : (
                    <Button variant="outline" onClick={stopScanning} className="gap-2">
                        <X className="w-4 h-4" />
                        Detener
                    </Button>
                )}
                <Button variant="outline" onClick={onClose}>
                    Cerrar
                </Button>
            </DialogFooter>
        </DialogContent>
    );
}
