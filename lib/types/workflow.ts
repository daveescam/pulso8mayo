export type WorkflowStepType = "TEXT" | "NUMBER" | "SELECT" | "PHOTO" | "CHECKBOX" | "DATE" | "INFO" | "SIGNATURE";

export interface WorkflowStep {
    id: string; // Changed from UniqueIdentifier to string for easier DB storage
    type: WorkflowStepType;
    title: string;
    description?: string;
    required: boolean;
    config?: any; // Specific config for each type (e.g. options for select)
}

export interface WorkflowTemplateData {
    title: string;
    description?: string;
    category: string;
    steps: WorkflowStep[];
}
