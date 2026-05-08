# React Web Camera Integration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single-shot `<input type="file" capture>` photo capture with a live camera component using `@shivantra/react-web-camera` for multi-photo sessions, while keeping gallery upload as fallback, and fixing the storage to upload to R2 instead of storing base64 in DB.

**Architecture:** Create a reusable `CameraCapture` component that wraps `WebCamera` in a Dialog with capture UI. Integrate it into the 3 existing workflow photo components. Add a client-side upload utility that sends captured `File` objects to the existing `/api/upload` presigned-URL endpoint, then stores R2 URLs in the database instead of base64 data URLs.

**Tech Stack:** React 19, Next.js 16 (App Router), `@shivantra/react-web-camera` v1.2.0 (already installed), Radix Dialog, Tailwind CSS v4, Cloudflare R2 via presigned URLs

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `components/shared/camera-capture.tsx` | Create | Reusable camera dialog with multi-photo capture |
| `components/shared/use-photo-upload.ts` | Create | Hook for uploading File[] to R2 via presigned URLs |
| `components/execution/workflow-stepper.tsx` | Modify | Replace input-based capture with CameraCapture + upload hook |
| `components/workflow/workflow-executor.tsx` | Modify | Replace input-based capture with CameraCapture + fix upload |
| `components/workflow/ai-verification-status.tsx` | Modify | Add camera option for retry uploads |

---

## Key Context

- `@shivantra/react-web-camera` v1.2.0 is already in package.json but has ZERO imports in the codebase
- Current photo capture uses `<input type="file" accept="image/*" capture="environment">` which only allows 1 photo at a time on mobile
- `workflow-stepper.tsx` stores base64 data URLs in DB (bloated)
- `workflow-executor.tsx` has a broken `uploadFiles` that returns empty URLs
- The `/api/upload` route already provides presigned URL generation for R2
- The barcode-scanner.tsx uses a similar Dialog + getUserMedia pattern we can follow

## WebCamera API Reference

- `ref={cameraHandler}` where `cameraHandler: RefObject<WebCameraHandler>`
- `cameraHandler.current?.capture()` returns `Promise<File | null>`
- `cameraHandler.current?.switch()` toggles front/back camera
- `cameraHandler.current?.stop()` releases the MediaStream
- `cameraHandler.current?.getMode()` returns "front" | "back"
- Props: captureMode ("front"|"back"), captureType ("jpeg"|"png"|"webp"), captureQuality (0.1-1.0), onError

---

### Task 1: Create `usePhotoUpload` hook

**Files:**
- Create: `components/shared/use-photo-upload.ts`

- [ ] **Step 1: Create directory and hook file**

```typescript
"use client";

import { useState, useCallback } from "react";

interface UploadResult {
  url: string;
  key: string;
  name: string;
}

interface UsePhotoUploadReturn {
  uploadPhotos: (files: File[]) => Promise<UploadResult[]>;
  uploading: boolean;
  progress: number;
  error: string | null;
}

export function usePhotoUpload(): UsePhotoUploadReturn {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uploadPhotos = useCallback(async (files: File[]): Promise<UploadResult[]> => {
    setUploading(true);
    setProgress(0);
    setError(null);

    const results: UploadResult[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        const presignRes = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileName: file.name, fileType: file.type }),
        });

        if (!presignRes.ok) {
          throw new Error(`Failed to get upload URL for ${file.name}`);
        }

        const { uploadUrl, key, fileUrl } = await presignRes.json();

        const uploadRes = await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });

        if (!uploadRes.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }

        results.push({ url: fileUrl, key, name: file.name });
        setProgress(Math.round(((i + 1) / files.length) * 100));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setError(message);
      throw err;
    } finally {
      setUploading(false);
    }

    return results;
  }, []);

  return { uploadPhotos, uploading, progress, error };
}
```

- [ ] **Step 2: Verify with lint**

Run: `pnpm run lint`

- [ ] **Step 3: Commit**

```bash
git add components/shared/use-photo-upload.ts
git commit -m "feat: add usePhotoUpload hook for R2 uploads via presigned URLs"
```

---

### Task 2: Create `CameraCapture` component

**Files:**
- Create: `components/shared/camera-capture.tsx`

- [ ] **Step 1: Create the component file**

```tsx
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
  const [captured, setCaptured] = useState<{ file: File; preview: string }[]>([]);
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
            Toma fotos directamente con la camara. Puedes capturar multiples fotos antes de confirmar.
          </DialogDescription>
        </DialogHeader>

        <div className="relative bg-black">
          {cameraError ? (
            <div className="flex flex-col items-center justify-center h-64 p-4 text-center">
              <AlertCircle className="h-10 w-10 text-destructive mb-2" />
              <p className="text-sm text-destructive">{cameraError}</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => setCameraError(null)}>
                Reintentar
              </Button>
            </div>
          ) : (
            <WebCamera
              captureMode="back"
              captureType="jpeg"
              captureQuality={0.8}
              getFileName={() => `evidence-${Date.now()}.jpeg`}
              onError={(err) => setCameraError(err.message || "Error al acceder a la camara")}
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
              {captured.length !== 1 ? "s" : ""}
              {maxPhotos && ` (max ${maxPhotos})`}
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {captured.map((item, idx) => (
                <div key={idx} className="relative flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.preview} alt={`Captura ${idx + 1}`} className="h-16 w-20 object-cover rounded border" />
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
          <Button variant="ghost" size="sm" onClick={handleSwitch} disabled={!!cameraError} className="gap-1.5">
            <SwitchCamera className="h-4 w-4" />
            Cambiar
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCapture} disabled={!!cameraError || captured.length >= maxPhotos} className="gap-1.5">
              <Camera className="h-4 w-4" />
              Capturar
            </Button>
            <Button size="sm" onClick={handleConfirm} disabled={captured.length === 0} className="gap-1.5">
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
```

- [ ] **Step 2: Verify with lint**

Run: `pnpm run lint`

- [ ] **Step 3: Commit**

```bash
git add components/shared/camera-capture.tsx
git commit -m "feat: add CameraCapture component wrapping react-web-camera"
```

---

### Task 3: Integrate into `workflow-stepper.tsx`

**Files:**
- Modify: `components/execution/workflow-stepper.tsx`
  - Lines 1-12: add imports
  - ~Line 240: add cameraOpen state + usePhotoUpload hook
  - Lines 279-305: replace handleFileUpload to upload to R2 instead of base64
  - After line 305: add handleCameraConfirm
  - Lines 645-699: replace PHOTO UI with camera + gallery buttons

- [ ] **Step 1: Add imports (after line 12)**

```typescript
import { CameraCapture } from "@/components/shared/camera-capture";
import { usePhotoUpload } from "@/components/shared/use-photo-upload";
```

- [ ] **Step 2: Add state and hook (~line 240)**

```typescript
const [cameraOpen, setCameraOpen] = useState(false);
const { uploadPhotos, uploading: uploadingPhotos, progress: uploadProgress } = usePhotoUpload();
```

- [ ] **Step 3: Add camera confirm handler (after handleFileUpload)**

```typescript
const handleCameraConfirm = useCallback(async (files: File[]) => {
  try {
    const results = await uploadPhotos(files);
    const urls = results.map((r) => r.url);
    setEvidenceUrl((prev) => {
      const current = Array.isArray(prev) ? prev : prev ? [prev] : [];
      return [...current, ...urls];
    });
  } catch {
    toast.error("Error al subir las fotos");
  }
}, [uploadPhotos]);
```

- [ ] **Step 4: Replace handleFileUpload (lines 279-305) to upload to R2**

Replace the existing `handleFileUpload` with:

```typescript
const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = e.target.files;
  if (!files || files.length === 0) return;

  const validFiles: File[] = [];
  for (const file of Array.from(files)) {
    if (!file.type.startsWith("image/")) {
      toast.error("Solo se permiten imagenes");
      continue;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Imagen demasiado grande (max 10MB)");
      continue;
    }
    validFiles.push(file);
  }

  if (validFiles.length === 0) return;

  try {
    const results = await uploadPhotos(validFiles);
    const urls = results.map((r) => r.url);
    setEvidenceUrl((prev) => {
      const current = Array.isArray(prev) ? prev : prev ? [prev] : [];
      return [...current, ...urls];
    });
  } catch {
    toast.error("Error al subir las fotos");
  }

  if (fileInputRef.current) fileInputRef.current.value = "";
}, [uploadPhotos]);
```

- [ ] **Step 5: Replace PHOTO step UI (lines 645-699)**

Replace `{/* ===== PHOTO (Real file upload) ===== */}` block with:

```tsx
{/* ===== PHOTO (Live camera + gallery upload) ===== */}
{currentStepDef.type === "PHOTO" && (
  <div className="space-y-4">
    <Label>Evidencia Fotografica</Label>
    <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileUpload} />

    {uploadingPhotos && (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Subiendo... {uploadProgress}%
      </div>
    )}

    {(Array.isArray(evidenceUrl) ? evidenceUrl : evidenceUrl ? [evidenceUrl] : []).length > 0 && (
      <div className="grid grid-cols-2 gap-2">
        {(Array.isArray(evidenceUrl) ? evidenceUrl : evidenceUrl ? [evidenceUrl] : []).map((url: string, idx: number) => (
          <div key={idx} className="relative aspect-video rounded-lg overflow-hidden border group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`Evidencia ${idx + 1}`} className="absolute inset-0 w-full h-full object-cover" />
            <Button variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => {
                const current = Array.isArray(evidenceUrl) ? evidenceUrl : [evidenceUrl];
                const newUrls = current.filter((_, i) => i !== idx);
                setEvidenceUrl(newUrls.length === 0 ? "" : newUrls);
              }}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
    )}

    <div className="flex flex-col gap-2">
      <Button variant="outline" className="w-full h-12 gap-2" onClick={() => setCameraOpen(true)} disabled={uploadingPhotos}>
        <Camera className="w-4 h-4" />
        Abrir Camara
      </Button>
      <Button variant="ghost" className="w-full h-10 gap-2 text-muted-foreground" onClick={() => {
          if (fileInputRef.current) {
            fileInputRef.current.removeAttribute("capture");
            fileInputRef.current.click();
          }
        }} disabled={uploadingPhotos}>
        <Upload className="w-4 h-4" />
        Subir desde Galeria
      </Button>
    </div>

    <CameraCapture open={cameraOpen} onOpenChange={setCameraOpen} onConfirm={handleCameraConfirm} maxPhotos={10} />
  </div>
)}
```

- [ ] **Step 6: Lint and commit**

```bash
pnpm run lint
git add components/execution/workflow-stepper.tsx
git commit -m "feat: integrate CameraCapture into workflow stepper with R2 upload"
```

---

### Task 4: Integrate into `workflow-executor.tsx`

**Files:**
- Modify: `components/workflow/workflow-executor.tsx`
  - Lines 1-19: add imports
  - After state declarations: add cameraOpen + usePhotoUpload
  - Lines 190-194: replace broken uploadFiles placeholder
  - After handleFileSelect: add handleCameraConfirm
  - Lines 373-447: replace PHOTO case with camera + gallery

- [ ] **Step 1: Add imports (after line 19)**

```typescript
import { CameraCapture } from "@/components/shared/camera-capture";
import { usePhotoUpload } from "@/components/shared/use-photo-upload";
```

- [ ] **Step 2: Add state and hook**

```typescript
const [cameraOpen, setCameraOpen] = React.useState(false);
const { uploadPhotos, uploading: uploadingPhotos } = usePhotoUpload();
```

- [ ] **Step 3: Replace broken uploadFiles placeholder (lines 190-194)**

Replace:
```typescript
const { uploadFiles } = {
  uploadFiles: async (files: File[]) => {
    return files.map(file => ({ url: '', name: file.name }));
  }
};
```

With:
```typescript
const uploadFiles = async (files: File[]): Promise<{ url: string; name: string }[]> => {
  const results = await uploadPhotos(files);
  return results.map((r) => ({ url: r.url, name: r.name }));
};
```

- [ ] **Step 4: Add camera confirm handler**

```typescript
const handleCameraConfirm = async (files: File[]) => {
  try {
    await uploadPhotos(files);
    setEvidenceFiles((prev: File[]) => [...(Array.isArray(prev) ? prev : []), ...files]);
  } catch {
    toast.error("Error al subir las fotos");
  }
};
```

- [ ] **Step 5: Replace PHOTO case UI (lines 373-447)**

Add "Abrir Camara" button below the drag-drop area and add `<CameraCapture>` at the end of the PHOTO case div. Keep the existing drag-drop upload, existing evidence display, and add the camera button:

After the `</label>` closing tag (end of drag-drop area), add:

```tsx
<div className="flex flex-col gap-2">
  <Button variant="outline" className="w-full gap-2" onClick={() => setCameraOpen(true)} disabled={uploadingPhotos}>
    <Camera className="w-4 h-4" />
    Abrir Camara
  </Button>
</div>

{uploadingPhotos && (
  <p className="text-sm text-muted-foreground text-center">Subiendo fotos...</p>
)}
```

And add before the closing `</div>` of the PHOTO case:

```tsx
<CameraCapture open={cameraOpen} onOpenChange={setCameraOpen} onConfirm={handleCameraConfirm} maxPhotos={10} />
```

- [ ] **Step 6: Lint and commit**

```bash
pnpm run lint
git add components/workflow/workflow-executor.tsx
git commit -m "feat: integrate CameraCapture into workflow executor with real R2 upload"
```

---

### Task 5: Integrate into `ai-verification-status.tsx`

**Files:**
- Modify: `components/workflow/ai-verification-status.tsx`
  - Line 4: add Camera to lucide imports
  - After line 9: add CameraCapture + usePhotoUpload imports
  - After line 38: add cameraOpen state + usePhotoUpload hook
  - After handleFileChange: add handleCameraConfirm
  - Lines 164-186: replace upload section with camera + upload buttons

- [ ] **Step 1: Add Camera to lucide imports (line 4)**

```typescript
import { CheckCircle2, XCircle, AlertTriangle, Clock, RefreshCw, Upload, Image as ImageIcon, Camera } from "lucide-react";
```

- [ ] **Step 2: Add imports (after line 9)**

```typescript
import { CameraCapture } from "@/components/shared/camera-capture";
import { usePhotoUpload } from "@/components/shared/use-photo-upload";
```

- [ ] **Step 3: Add state and hook (after fileInputRef)**

```typescript
const [cameraOpen, setCameraOpen] = React.useState(false);
const { uploadPhotos } = usePhotoUpload();
```

- [ ] **Step 4: Add camera confirm handler**

```typescript
const handleCameraConfirm = async (files: File[]) => {
  try {
    const results = await uploadPhotos(files);
    if (results.length > 0 && onUpload) {
      const response = await fetch(results[0].url);
      const blob = await response.blob();
      const file = new File([blob], results[0].name, { type: blob.type });
      onUpload(file);
    }
  } catch {
    // Upload error handled by hook error state
  }
};
```

- [ ] **Step 5: Replace upload section (lines 164-186)**

Replace `{/* Upload Button (if pending) */}` block with:

```tsx
{/* Upload Button (if pending) */}
{status.status === "pending" && onUpload && (
  <div className="flex flex-col items-center justify-center gap-4 py-8">
    <div className="text-center text-sm text-muted-foreground">
      Sube una foto para verificacion
    </div>
    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
    <div className="flex gap-2">
      <Button onClick={() => setCameraOpen(true)} variant="outline" className="gap-2">
        <Camera className="h-4 w-4" />
        Abrir Camara
      </Button>
      <Button onClick={() => fileInputRef.current?.click()} className="gap-2">
        <Upload className="h-4 w-4" />
        Subir Foto
      </Button>
    </div>
    <CameraCapture open={cameraOpen} onOpenChange={setCameraOpen} onConfirm={handleCameraConfirm} maxPhotos={1} />
  </div>
)}
```

- [ ] **Step 6: Lint and commit**

```bash
pnpm run lint
git add components/workflow/ai-verification-status.tsx
git commit -m "feat: add camera capture option to AI verification retry upload"
```

---

### Task 6: Verify build

- [ ] **Step 1: Run full build**

Run: `pnpm run build`

Expected: Build succeeds with no errors.

- [ ] **Step 2: Run lint**

Run: `pnpm run lint`

- [ ] **Step 3: Manual test**

Run: `pnpm run dev`

Open a workflow with a PHOTO step. Verify:
1. "Abrir Camara" button opens camera dialog
2. Camera feed appears (localhost is exempt from HTTPS requirement)
3. "Capturar" takes a photo, thumbnail appears
4. "Cambiar" switches between front/back camera
5. "Confirmar" closes dialog and uploads to R2
6. "Subir desde Galeria" opens file picker (no camera)
7. Thumbnails show R2 URLs (not base64 data URLs)
8. Delete button works on thumbnails

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve build/lint issues from camera integration"
```

---

## Self-Review

- [x] **Spec coverage:** Multi-photo capture - Task 2. Gallery preserved - Tasks 3-5. R2 upload - Task 1 + Tasks 3-5. All 3 components - Tasks 3, 4, 5.
- [x] **Placeholder scan:** No TBD/TODO patterns.
- [x] **Type consistency:** usePhotoUpload returns UploadResult[]. CameraCapture onConfirm takes File[]. All handlers match.
