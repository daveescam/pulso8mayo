export type WorkflowStepType =
 | "TEXT" | "NUMBER" | "SELECT" | "PHOTO" | "CHECKBOX"
 | "DATE" | "INFO" | "SIGNATURE"
 | "YESNO" | "TIME" | "TIMER" | "LOCATION" | "AUDIO" | "VIDEO";

export interface AIVerification {
  enabled: boolean;
  prompt?: string;
  expectedConditions?: string[];
  confidenceThreshold?: number;
}

export interface LogicRule {
  id?: string;
  condition: string;
  severity: string;
  message: string;
  remediationProtocol?: {
    enabled: boolean;
    maxAttempts?: number;
    timeoutMinutes?: number;
    steps?: Array<{ instruction: string; waitSeconds?: number }>;
  };
  escalationChain?: Array<{
    level: number;
    triggerAfterMinutes: number;
    notifyRoles?: string[];
    channel: string;
    message: string;
  }>;
}

export interface Branch {
  condition: string;
  gotoStep?: string;
  label?: string;
}

export interface StepValidation {
  min?: number;
  max?: number;
  minTime?: string;
  maxTime?: string;
  radiusMeters?: number;
  pattern?: string;
  customMessage?: string;
}

export interface WorkflowStep {
  id: string;
  type: WorkflowStepType;
  title: string;
  description?: string;
  required: boolean;
  config?: any;
  unit?: string;
  metadata?: Record<string, any>;
  aiVerification?: AIVerification;
  logicRules?: LogicRule[];
  branches?: Branch[];
  validation?: StepValidation;
  readOnly?: boolean;
  conditionalLogic?: any;
  options?: string[];
  placeholder?: string;
  defaultValue?: string;
}

export interface WorkflowTemplateData {
  title: string;
  description?: string;
  category: string;
  steps: WorkflowStep[];
  aiConfig?: any;
  complianceConfig?: any;
  completionActions?: any[];
  tags?: string[];
  duracionEstimada?: string;
}
