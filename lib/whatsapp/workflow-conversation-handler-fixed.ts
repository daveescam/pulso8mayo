interface WorkflowStep {
  id: string;
  title?: string;
  description?: string;
  [key: string]: unknown;
}

interface WorkflowTemplateWithSteps {
  id: string;
  name?: string;
  description?: string;
  steps?: WorkflowStep[];
  [key: string]: unknown;
}

interface WorkflowInstanceWithTemplate {
  id: string;
  workflowTemplateId: string;
  template?: WorkflowTemplateWithSteps;
  [key: string]: unknown;
}
