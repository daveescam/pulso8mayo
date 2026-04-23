import { db } from '@/lib/db';
import { incidents } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * RemediationService - Manages guided self-fix remediation protocols
 * 
 * Responsibilities:
 * - Start remediation protocols from incidents
 * - Track remediation attempts
 * - Validate remediation completion
 * - Trigger escalation if remediation fails
 */
export class RemediationService {
    /**
     * Starts a remediation protocol for an incident
     * 
     * @param incident - The incident to remediate
     * @returns Remediation instructions for the first step
     */
    static async startRemediationProtocol(incident: any) {
        try {
            console.log(`[RemediationService] Starting remediation for incident ${incident.id}`);

            const protocol = incident.remediationProtocol as any;

            if (!protocol || !protocol.enabled) {
                console.log('[RemediationService] No remediation protocol configured');
                return null;
            }

            if (!protocol.steps || protocol.steps.length === 0) {
                console.log('[RemediationService] No remediation steps defined');
                return null;
            }

            // Update incident status
            await db
                .update(incidents)
                .set({
                    status: 'IN_REMEDIATION',
                    metadata: {
                        ...(incident.metadata as any),
                        remediationStartedAt: new Date().toISOString(),
                        remediationCurrentStep: 0,
                        remediationAttempts: 0,
                        remediationMaxAttempts: protocol.maxAttempts || 2,
                    },
                })
                .where(eq(incidents.id, incident.id));

            // Return first step instructions
            const firstStep = protocol.steps[0];
            console.log('[RemediationService] Remediation started, first step:', firstStep.instruction);

            return {
                incidentId: incident.id,
                step: 0,
                totalSteps: protocol.steps.length,
                instruction: firstStep.instruction,
                waitSeconds: firstStep.waitSeconds,
                verification: firstStep.verification,
            };
        } catch (error) {
            console.error('[RemediationService] Error starting remediation:', error);
            throw error;
        }
    }

    /**
     * Tracks a remediation attempt
     * 
     * @param incidentId - Incident ID
     * @param stepIndex - Current step index
     * @param success - Whether the attempt was successful
     * @returns Next step or completion status
     */
    static async trackRemediationAttempt(
        incidentId: string,
        stepIndex: number,
        success: boolean
    ) {
        try {
            const [incident] = await db
                .select()
                .from(incidents)
                .where(eq(incidents.id, incidentId))
                .limit(1);

            if (!incident) {
                throw new Error('Incident not found');
            }

            const metadata = incident.metadata as any;
            const protocol = incident.remediationProtocol as any;

            if (!protocol || !protocol.steps) {
                throw new Error('No remediation protocol configured');
            }

            const currentAttempts = (metadata.remediationAttempts || 0) + 1;
            const maxAttempts = metadata.remediationMaxAttempts || protocol.maxAttempts || 2;

            console.log(`[RemediationService] Attempt ${currentAttempts}/${maxAttempts} for incident ${incidentId}`);

            if (success) {
                // Move to next step or complete
                const nextStepIndex = stepIndex + 1;

                if (nextStepIndex >= protocol.steps.length) {
                    // Remediation complete
                    await db
                        .update(incidents)
                        .set({
                            status: 'RESOLVED',
                            resolvedAt: new Date(),
                            resolution: 'Resolved through remediation protocol',
                            metadata: {
                                ...metadata,
                                remediationCompletedAt: new Date().toISOString(),
                                remediationAttempts: currentAttempts,
                            },
                        })
                        .where(eq(incidents.id, incidentId));

                    console.log('[RemediationService] Remediation completed successfully');

                    // Cancel escalations
                    const { EscalationService } = await import('./escalation-service');
                    await EscalationService.cancelEscalation(incidentId);

                    return {
                        completed: true,
                        message: 'Remediation completed successfully',
                    };
                } else {
                    // Move to next step
                    const nextStep = protocol.steps[nextStepIndex];

                    await db
                        .update(incidents)
                        .set({
                            metadata: {
                                ...metadata,
                                remediationCurrentStep: nextStepIndex,
                                remediationAttempts: currentAttempts,
                            },
                        })
                        .where(eq(incidents.id, incidentId));

                    console.log('[RemediationService] Moving to next step:', nextStepIndex);

                    return {
                        completed: false,
                        step: nextStepIndex,
                        totalSteps: protocol.steps.length,
                        instruction: nextStep.instruction,
                        waitSeconds: nextStep.waitSeconds,
                        verification: nextStep.verification,
                    };
                }
            } else {
                // Attempt failed
                if (currentAttempts >= maxAttempts) {
                    // Max attempts reached, trigger escalation
                    console.log('[RemediationService] Max attempts reached, triggering escalation');

                    await db
                        .update(incidents)
                        .set({
                            status: 'ESCALATED',
                            metadata: {
                                ...metadata,
                                remediationFailedAt: new Date().toISOString(),
                                remediationAttempts: currentAttempts,
                                remediationFailed: true,
                            },
                        })
                        .where(eq(incidents.id, incidentId));

                    // Trigger escalation
                    const escalationChain = incident.escalationChain as any[];
                    if (escalationChain && escalationChain.length > 0) {
                        const { EscalationService } = await import('./escalation-service');

                        // Find escalation level with triggerCondition = 'remediation_failed'
                        const failureLevel = escalationChain.find(
                            level => level.triggerCondition === 'remediation_failed'
                        );

                        if (failureLevel) {
                            await EscalationService.manualEscalate(
                                incidentId,
                                failureLevel.level,
                                'system'
                            );
                        }
                    }

                    return {
                        completed: false,
                        failed: true,
                        message: 'Remediation failed after maximum attempts',
                    };
                } else {
                    // Retry same step
                    await db
                        .update(incidents)
                        .set({
                            metadata: {
                                ...metadata,
                                remediationAttempts: currentAttempts,
                            },
                        })
                        .where(eq(incidents.id, incidentId));

                    const currentStep = protocol.steps[stepIndex];

                    return {
                        completed: false,
                        retry: true,
                        attemptsRemaining: maxAttempts - currentAttempts,
                        step: stepIndex,
                        totalSteps: protocol.steps.length,
                        instruction: currentStep.instruction,
                        waitSeconds: currentStep.waitSeconds,
                        verification: currentStep.verification,
                    };
                }
            }
        } catch (error) {
            console.error('[RemediationService] Error tracking remediation attempt:', error);
            throw error;
        }
    }

    /**
     * Validates remediation completion based on verification criteria
     * 
     * @param incidentId - Incident ID
     * @param stepIndex - Current step index
     * @param newValue - New value submitted (e.g., new photo, new reading)
     * @param aiResult - AI verification result (if applicable)
     * @returns Validation result
     */
    static async validateRemediationCompletion(
        incidentId: string,
        stepIndex: number,
        newValue: any,
        aiResult?: any
    ) {
        try {
            const [incident] = await db
                .select()
                .from(incidents)
                .where(eq(incidents.id, incidentId))
                .limit(1);

            if (!incident) {
                throw new Error('Incident not found');
            }

            const protocol = incident.remediationProtocol as any;
            if (!protocol || !protocol.steps || !protocol.steps[stepIndex]) {
                throw new Error('Invalid remediation step');
            }

            const step = protocol.steps[stepIndex];
            const verification = step.verification;

            if (!verification) {
                // No verification required, assume success
                return { passed: true, reason: 'No verification required' };
            }

            // Handle different verification types
            if (verification.type === 'ai_photo_verification') {
                if (!aiResult) {
                    return { passed: false, reason: 'AI verification required but not provided' };
                }

                // Check if AI result meets target condition
                const targetCondition = verification.targetCondition;
                if (targetCondition) {
                    // Evaluate condition (e.g., "ai_result.passed == true")
                    const { IncidentEngine } = await import('./incident-engine');
                    const passed = IncidentEngine.evaluateCondition(targetCondition, {
                        ai_result: aiResult,
                        value: newValue,
                    });

                    return {
                        passed,
                        reason: passed
                            ? 'AI verification passed'
                            : `AI verification failed: ${aiResult.reason}`,
                    };
                }

                return {
                    passed: aiResult.passed,
                    reason: aiResult.reason,
                };
            }

            if (verification.type === 'value_comparison') {
                // Compare new value against target
                const target = verification.target;
                const operator = verification.operator || '==';

                let passed = false;
                switch (operator) {
                    case '==':
                        passed = newValue == target;
                        break;
                    case '>':
                        passed = newValue > target;
                        break;
                    case '<':
                        passed = newValue < target;
                        break;
                    case '>=':
                        passed = newValue >= target;
                        break;
                    case '<=':
                        passed = newValue <= target;
                        break;
                }

                return {
                    passed,
                    reason: passed
                        ? 'Value meets target criteria'
                        : `Value ${newValue} does not meet criteria (${operator} ${target})`,
                };
            }

            // Default: assume success if no specific verification
            return { passed: true, reason: 'Verification completed' };
        } catch (error) {
            console.error('[RemediationService] Error validating remediation:', error);
            return { passed: false, reason: `Validation error: ${error}` };
        }
    }

    /**
     * Gets remediation status for an incident
     */
    static async getRemediationStatus(incidentId: string) {
        const [incident] = await db
            .select()
            .from(incidents)
            .where(eq(incidents.id, incidentId))
            .limit(1);

        if (!incident) {
            return null;
        }

        const metadata = incident.metadata as any;
        const protocol = incident.remediationProtocol as any;

        return {
            incidentId: incident.id,
            status: incident.status,
            currentStep: metadata.remediationCurrentStep || 0,
            totalSteps: protocol?.steps?.length || 0,
            attempts: metadata.remediationAttempts || 0,
            maxAttempts: metadata.remediationMaxAttempts || protocol?.maxAttempts || 2,
            startedAt: metadata.remediationStartedAt,
            completedAt: metadata.remediationCompletedAt,
            failedAt: metadata.remediationFailedAt,
        };
    }
}
