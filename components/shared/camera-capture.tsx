"use client";

import React, { useRef, useState, useCallback } from "react";
import { WebCamera, WebCameraHandler } from "@shivantra/react-web-camera";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, SwitchCamera, X, Check, AlertCircle } from "lucide-react";

interface CameraCaptureProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (files: File[]) => void;
  maxPhotos?: number;
}

export function CameraCapture({
  open,
  onOpenChange,
  onConfirm,
  maxPhotos = 10,
}: CameraCaptureProps) {
  const cameraHandler = useRef<WebCameraHandler>(null);
  const [captured, setCaptured] = useState<{ file: File; preview: string }[]>(
    []
  );
  const [cameraError, setCameraError] = useState<string | null>(null);

  const handleCapture = useCallback(async () => {
    if (captured.length >= maxPhotos) return;
    const file = await cameraHandler.current?.capture();
    if (!file) return;
    const preview = await fileToDataURL(file);
    setCaptured((prev) => [...prev, { file, preview }]);
  }, [captured.length, maxPhotos]);

  const handleSwitch = useCallback(() => {
    cameraHandler.current?.switch();
  }, []);

  const handleRemove = useCallback((index: number) => {
    setCaptured((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleConfirm = useCallback(() => {
    onConfirm(captured.map((c) => c.file));
    setCaptured([]);
    cameraHandler.current?.stop();
    onOpenChange(false);
  }, [captured, onConfirm, onOpenChange]);

  const handleCancel = useCallback(() => {
    setCaptured([]);
    cameraHandler.current?.stop();
    onOpenChange(false);
  }, [onOpenChange]);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        handleCancel();
      } else {
        setCameraError(null);
      }
      onOpenChange(nextOpen);
    },
    [handleCancel, onOpenChange]
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg w-full p-0 gap-0 overflow-hidden sm:max-w-md">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Captura de Evidencia
          </DialogTitle>
          <DialogDescription>
            Toma fotos directamente con la cámara. Puedes capturar múltiples fotos
            antes de confirmar.
          </DialogDescription>
        </DialogHeader>

        <div className="relative bg-black">
          {cameraError ? (
            <div className="flex flex-col items-center justify-center h-64 p-4 text-center">
              <AlertCircle className="h-10 w-10 text-destructive mb-2" />
              <p className="text-sm text-destructive">{cameraError}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => setCameraError(null)}
              >
                Reintentar
              </Button>
            </div>
          ) : (
            <WebCamera
              captureMode="back"
              captureType="jpeg"
              captureQuality={0.8}
              getFileName={() => `evidence-${Date.now()}.jpeg`}
              onError={(err) =>
                setCameraError(err.message || "Error al acceder a la cámara")
              }
              className="w-full"
              style={{ height: 320, width: "100%" }}
              videoStyle={{ objectFit: "cover", borderRadius: 0 }}
            />
          )}
        </div>

        {captured.length > 0 && (
          <div className="p-3 border-t">
            <p className="text-xs text-muted-foreground mb-2">
              {captured.length} foto{captured.length !== 1 ? "s" : ""} capturada
              {captured.length !== 1 ? "s" : ""}{" "}
              {maxPhotos && `(max ${maxPhotos})`}
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {captured.map((item, idx) => (
                <div key={idx} className="relative flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.preview}
                    alt={`Captura ${idx + 1}`}
                    className="h-16 w-20 object-cover rounded border"
                  />
                  <button
                    onClick={() => handleRemove(idx)}
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between p-3 border-t bg-muted/30">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSwitch}
            disabled={!!cameraError}
            className="gap-1.5"
          >
            <SwitchCamera className="h-4 w-4" />
            Cambiar
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCapture}
              disabled={!!cameraError || captured.length >= maxPhotos}
              className="gap-1.5"
            >
              <Camera className="h-4 w-4" />
              Capturar
            </Button>
            <Button
              size="sm"
              onClick={handleConfirm}
              disabled={captured.length === 0}
              className="gap-1.5"
            >
              <Check className="h-4 w-4" />
              Confirmar ({captured.length})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

async function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
