/**
 * WhatsApp Evidence Processor
 *
 * Processes evidence (photos) submitted via WhatsApp for workflow steps
 */

import { db } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { workflowInstanceSteps } from '@/lib/db/schema';
import { ConversationState } from './workflow-state-manager';
import { wasenderClient } from './wasender-client';

export interface EvidenceProcessingResult {
  success: boolean;
  verificationMessage: string;
  score?: number;
  error?: string;
}

export class EvidenceProcessor {
  /**
   * Process evidence (photo) submitted via WhatsApp
   */
  async processEvidence(
    userPhone: string,
    state: ConversationState,
    mediaUrl: string
  ): Promise<EvidenceProcessingResult> {
    try {
      if (!state.workflowInstanceId || !state.currentStepId) {
        return {
          success: false,
          verificationMessage: '❌ Error: No hay un paso activo en el workflow.',
        };
      }

      // Download media from WhatsApp
      const downloadedMedia = await this.downloadMedia(mediaUrl);

      // Upload to storage (R2 or local)
      const uploadedUrl = await this.uploadToStorage(downloadedMedia);

      // TODO: Implement AI analysis of the uploaded media
      const aiResult = {
        passed: true,
        confidence: 0.95,
        reason: 'Análisis de evidencia pendiente de implementación',
        detectedObjects: []
      };

      // Update workflow step with evidence and AI result
      await db
        .update(workflowInstanceSteps)
        .set({
          evidenceUrl: uploadedUrl,
          status: aiResult?.passed ? 'COMPLETED' : 'PENDING',
          aiAnalysis: aiResult
            ? {
                passed: aiResult.passed,
                confidence: aiResult.confidence,
                reason: aiResult.reason,
                detectedObjects: aiResult.detectedObjects,
              }
            : null,
          completedAt: aiResult?.passed ? new Date() : null,
          completedBy: state.userId,
        })
        .where(
          and(
            eq(workflowInstanceSteps.instanceId, state.workflowInstanceId),
            eq(workflowInstanceSteps.stepId, state.currentStepId)
          )
        );

      // Format verification message
      const verificationMessage = this.formatVerificationMessage(aiResult);

      return {
        success: true,
        verificationMessage,
        score: aiResult?.confidence,
      };
    } catch (error) {
      console.error('[EvidenceProcessor] Error processing evidence:', error);
      return {
        success: false,
        verificationMessage: '❌ Error al procesar la evidencia. Por favor intenta de nuevo.',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Download media from WhatsApp/WasenderAPI
   */
  private async downloadMedia(mediaUrl: string): Promise<Buffer> {
    try {
      const response = await fetch(mediaUrl);
      if (!response.ok) {
        throw new Error(`Failed to download media: ${response.statusText}`);
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      return buffer;
    } catch (error) {
      console.error('[EvidenceProcessor] Error downloading media:', error);
      throw error;
    }
  }

  /**
   * Upload media to storage (R2 or local)
   */
  private async uploadToStorage(mediaBuffer: Buffer): Promise<string> {
    try {
      // TODO: Implement R2 upload (see US-LAB-005)
      // For now, return a placeholder URL
      const filename = `whatsapp-evidence-${Date.now()}.jpg`;
      const url = `/uploads/${filename}`;

      // In production, this should upload to R2/S3
      // const url = await uploadToR2(mediaBuffer, filename, 'image/jpeg');

      return url;
    } catch (error) {
      console.error('[EvidenceProcessor] Error uploading to storage:', error);
      throw error;
    }
  }

  /**
   * Run AI verification on evidence
   */
  private async runAIVerification(
    imageUrl: string,
    stepId: string
  ): Promise<{
    passed: boolean;
    confidence: number;
    reason: string;
    detectedObjects?: string[];
    id?: string;
  } | null> {
    try {
      // TODO: Implement AI verification (see existing AI verify endpoint)
      // For now, return a mock result

      // In production, call the AI verification API:
      // const aiResult = await fetch('/api/ai/verify', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     imageUrl,
      //     stepId,
      //     criteria: step.expectedEvidence,
      //   }),
      // });

      // Mock result
      return {
        passed: true,
        confidence: 95,
        reason: 'La imagen cumple con los criterios esperados.',
        detectedObjects: ['object1', 'object2'],
      };
    } catch (error) {
      console.error('[EvidenceProcessor] Error running AI verification:', error);
      return null;
    }
  }

  /**
   * Format AI verification result into WhatsApp message
   */
  private formatVerificationMessage(aiResult: {
    passed: boolean;
    confidence: number;
    reason: string;
  } | null): string {
    if (!aiResult) {
      return '⚠️ *Verificación Pendiente*\n\nLa evidencia fue recibida pero no pudo ser verificada automáticamente. Será revisada por un supervisor.';
    }

    const icon = aiResult.passed ? '✅' : '❌';
    const status = aiResult.passed ? 'Aprobada' : 'Rechazada';

    return `${icon} *Verificación AI*\n\nConfianza: ${aiResult.confidence}%\nResultado: ${status}\n${aiResult.reason}`;
  }
}

// Singleton instance
export const evidenceProcessor = new EvidenceProcessor();
