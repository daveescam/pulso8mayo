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

  const uploadPhotos = useCallback(
    async (files: File[]): Promise<UploadResult[]> => {
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
    },
    [],
  );

  return { uploadPhotos, uploading, progress, error };
}
