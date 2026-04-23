import { AIService } from "./ai-service";
import { VerificationRule, VerificationResult, AIAnalysisResult, VerificationType } from "../types/ai-verification";

export class VerificationEngine {
    /**
     * Evaluates a photo against a set of verification rules.
     */
    static async evaluate(
        photoUrl: string,
        rule: VerificationRule
    ): Promise<VerificationResult> {
        // 1. Perform AI Analysis
        const aiResult = await AIService.performVerification(photoUrl, rule.verificationType, {
            expectedObjects: rule.expectedObjects,
            categories: rule.expectedObjects // Reusing field for classification categories if needed
        });

        // 2. Evaluate Rule Logic
        let success = aiResult.passed; // Default to AI's simple pass/fail judgment first
        let requiresManualReview = false;

        // Confidence Check
        if (aiResult.confidence < rule.minConfidence) {
            success = false;
            requiresManualReview = true;
        }

        // Specific Logic per Type
        switch (rule.verificationType) {
            case VerificationType.DETECCION_OBJETOS:
                if (rule.expectedObjects && rule.expectedObjects.length > 0) {
                    // Simple string check for now. Ideally we parse the AI response strictly.
                    // The prompt asks for comma-separated list.
                    const detected = aiResult.reason.toLowerCase();
                    const missing = rule.expectedObjects.filter(obj => !detected.includes(obj.toLowerCase()));
                    if (missing.length > 0) {
                        success = false;
                        aiResult.reason = `Missing required objects: ${missing.join(', ')}. AI Detects: ${aiResult.reason}`;
                    }
                }
                break;

            case VerificationType.ANALISIS_SEGURIDAD:
                if (aiResult.reason.toUpperCase().includes("UNSAFE")) {
                    success = false;
                }
                break;
        }

        // Auto-approve logic overrides
        if (rule.autoApprove && success) {
            requiresManualReview = false;
        }

        // Manual Review Trigger
        if (!success && rule.requireManualReviewIfFailed) {
            requiresManualReview = true;
        }

        return {
            success,
            ruleId: rule.id,
            aiResult,
            requiresManualReview,
            timestamp: new Date()
        };
    }
}
