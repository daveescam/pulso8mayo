/**
 * Document Upload Handler
 * 
 * Handles file uploads to R2 storage with validation
 */

import { uploadToR2, generateFileKey } from './r2-client';

export interface UploadResult {
    url: string;
    fileKey: string;
    fileSize: number;
    mimeType: string;
}

export interface UploadOptions {
    companyId: string;
    userId: string;
    documentType: string;
    fileName: string;
    file: Buffer;
    mimeType: string;
    metadata?: Record<string, string>;
}

/**
 * Handle document upload to R2
 */
export async function handleDocumentUpload(options: UploadOptions): Promise<UploadResult> {
    const { companyId, userId, documentType, fileName, file, mimeType, metadata } = options;

    // Validate file size (max 10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.length > MAX_FILE_SIZE) {
        throw new Error('El archivo excede el tamaño máximo permitido (10MB)');
    }

    // Validate file type
    const ALLOWED_TYPES = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/jpg',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!ALLOWED_TYPES.includes(mimeType)) {
        throw new Error('Tipo de archivo no permitido. Solo se aceptan PDF, imágenes y documentos Word.');
    }

    // Generate unique file key
    const fileKey = generateFileKey(companyId, userId, documentType, fileName);

    // Upload to R2
    const url = await uploadToR2(file, fileKey, mimeType, metadata);

    return {
        url,
        fileKey,
        fileSize: file.length,
        mimeType,
    };
}

/**
 * Validate file upload request
 */
export function validateUploadRequest(body: any): { valid: boolean; error?: string } {
    if (!body.documentType) {
        return { valid: false, error: 'documentType es requerido' };
    }

    if (!body.fileName) {
        return { valid: false, error: 'fileName es requerido' };
    }

    if (!body.file) {
        return { valid: false, error: 'file es requerido' };
    }

    return { valid: true };
}
