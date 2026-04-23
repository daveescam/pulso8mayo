/**
 * Cloudflare R2 Storage Client
 * 
 * Provides S3-compatible interface for Cloudflare R2 storage
 * Used for document and media storage in Pulso platform
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl as getS3SignedUrl } from '@aws-sdk/s3-request-presigner';

// Initialize R2 client
const r2Client = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT || `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'pulso-documents';
const PUBLIC_URL = process.env.R2_PUBLIC_URL || '';

/**
 * Upload file to R2 storage
 */
export async function uploadToR2(
    file: Buffer,
    key: string,
    contentType: string,
    metadata?: Record<string, string>
): Promise<string> {
    try {
        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            Body: file,
            ContentType: contentType,
            Metadata: metadata,
        });

        await r2Client.send(command);

        // Return public URL
        return PUBLIC_URL ? `${PUBLIC_URL}/${key}` : key;
    } catch (error) {
        console.error('[R2] Upload error:', error);
        throw new Error('Failed to upload file to storage');
    }
}

/**
 * Generate presigned URL for private documents
 */
export async function generatePresignedUrl(
    key: string,
    expiresIn: number = 3600
): Promise<string> {
    try {
        const command = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
        });

        const signedUrl = await getS3SignedUrl(r2Client, command, { expiresIn });
        return signedUrl;
    } catch (error) {
        console.error('[R2] Signed URL error:', error);
        throw new Error('Failed to generate signed URL');
    }
}

/**
 * Get file from R2
 */
export async function getFromR2(key: string): Promise<Buffer | null> {
    try {
        const command = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
        });

        const response = await r2Client.send(command);
        const body = response.Body;

        if (!body) {
            return null;
        }

        // Convert to buffer
        const chunks: Uint8Array[] = [];
        for await (const chunk of body as any) {
            chunks.push(chunk);
        }

        return Buffer.concat(chunks);
    } catch (error) {
        console.error('[R2] Get error:', error);
        return null;
    }
}

/**
 * Delete file from R2
 */
export async function deleteFromR2(key: string): Promise<void> {
    try {
        const command = new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
        });

        await r2Client.send(command);
    } catch (error) {
        console.error('[R2] Delete error:', error);
        throw new Error('Failed to delete file from storage');
    }
}

/**
 * Check if file exists in R2
 */
export async function fileExistsInR2(key: string): Promise<boolean> {
    try {
        const command = new HeadObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
        });

        await r2Client.send(command);
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Generate unique file key
 */
export function generateFileKey(
    companyId: string,
    userId: string,
    documentType: string,
    fileName: string
): string {
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `companies/${companyId}/users/${userId}/${documentType}/${timestamp}_${sanitizedFileName}`;
}
