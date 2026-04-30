export type WorkflowStepType = "TEXT" | "NUMBER" | "SELECT" | "PHOTO" | "CHECKBOX" | "DATE" | "INFO" | "SIGNATURE";

export interface WorkflowStep {
  id: string;
  type: WorkflowStepType;
  title: string;
  description?: string;
  required: boolean;
  config?: any;
  unit?: string;
  metadata?: Record<string, any>;
}

export interface WorkflowTemplateData {
    title: string;
    description?: string;
    category: string;
    steps: WorkflowStep[];
}
