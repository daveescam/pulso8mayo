'use client';

import { useState } from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface RemediationStep {
    instruction: string;
    validationCriteria?: {
        type: 'photo' | 'value';
        expectedValue?: any;
        aiPrompt?: string;
    };
}

interface RemediationWizardProps {
    incident: {
        id: string;
        title: string;
        description?: string;
        remediationProtocol?: {
            steps: RemediationStep[];
            maxAttempts?: number;
        };
    };
    currentStep?: number;
    currentAttempt?: number;
    onSubmitStep: (stepIndex: number, evidence: any) => Promise<{ success: boolean; message?: string }>;
    onComplete: () => void;
    onCancel: () => void;
}

export function RemediationWizard({
    incident,
    currentStep = 0,
    currentAttempt = 0,
    onSubmitStep,
    onComplete,
    onCancel,
}: RemediationWizardProps) {
    const [activeStep, setActiveStep] = useState(currentStep);
    const [evidence, setEvidence] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [stepResult, setStepResult] = useState<{ success: boolean; message?: string } | null>(null);

    const protocol = incident.remediationProtocol;
    const steps = protocol?.steps || [];
    const maxAttempts = protocol?.maxAttempts || 3;
    const progress = ((activeStep + 1) / steps.length) * 100;

    if (!protocol || steps.length === 0) {
        return (
            <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                    No remediation protocol available for this incident.
                </AlertDescription>
            </Alert>
        );
    }

    const currentStepData = steps[activeStep];

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setStepResult(null);

        try {
            const result = await onSubmitStep(activeStep, evidence);
            setStepResult(result);

            if (result.success) {
                // Move to next step or complete
                if (activeStep < steps.length - 1) {
                    setTimeout(() => {
                        setActiveStep(activeStep + 1);
                        setEvidence('');
                        setStepResult(null);
                    }, 1500);
                } else {
                    // All steps completed
                    setTimeout(() => {
                        onComplete();
                    }, 1500);
                }
            }
        } catch (error) {
            setStepResult({
                success: false,
                message: error instanceof Error ? error.message : 'Failed to submit step',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePrevious = () => {
        if (activeStep > 0) {
            setActiveStep(activeStep - 1);
            setEvidence('');
            setStepResult(null);
        }
    };

    return (
        <Card className="w-full max-w-2xl">
            <CardHeader>
                <div className="flex items-center justify-between mb-2">
                    <CardTitle>Remediation Protocol</CardTitle>
                    <Badge variant="outline">
                        Step {activeStep + 1} of {steps.length}
                    </Badge>
                </div>
                <CardDescription>{incident.title}</CardDescription>
                <Progress value={progress} className="mt-2" />
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Attempt Counter */}
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Attempt {currentAttempt + 1} of {maxAttempts}</span>
                    {currentAttempt >= maxAttempts - 1 && (
                        <Badge variant="destructive" className="text-xs">
                            Final Attempt
                        </Badge>
                    )}
                </div>

                {/* Current Step Instruction */}
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="font-medium">
                        {currentStepData.instruction}
                    </AlertDescription>
                </Alert>

                {/* Evidence Input */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">Evidence / Notes</label>
                    <Textarea
                        placeholder="Describe what you did or provide evidence URL..."
                        value={evidence}
                        onChange={(e) => setEvidence(e.target.value)}
                        rows={4}
                        disabled={isSubmitting}
                    />
                    {currentStepData.validationCriteria?.type === 'photo' && (
                        <p className="text-xs text-muted-foreground">
                            📸 Photo evidence required for validation
                        </p>
                    )}
                </div>

                {/* Step Result */}
                {stepResult && (
                    <Alert variant={stepResult.success ? 'default' : 'destructive'}>
                        {stepResult.success ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                            <XCircle className="h-4 w-4" />
                        )}
                        <AlertDescription>
                            {stepResult.message || (stepResult.success ? 'Step completed successfully!' : 'Step validation failed')}
                        </AlertDescription>
                    </Alert>
                )}
            </CardContent>

            <CardFooter className="flex justify-between">
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={handlePrevious}
                        disabled={activeStep === 0 || isSubmitting}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Previous
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={onCancel}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                </div>

                <Button
                    onClick={handleSubmit}
                    disabled={!evidence.trim() || isSubmitting}
                >
                    {isSubmitting ? (
                        'Validating...'
                    ) : activeStep < steps.length - 1 ? (
                        <>
                            Next Step
                            <ArrowRight className="h-4 w-4 ml-2" />
                        </>
                    ) : (
                        <>
                            Complete
                            <CheckCircle2 className="h-4 w-4 ml-2" />
                        </>
                    )}
                </Button>
            </CardFooter>
        </Card>
    );
}
