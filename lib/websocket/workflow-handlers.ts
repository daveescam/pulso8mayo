/**
 * Workflow Event Handlers
 *
 * Server-side handlers for workflow events that broadcast to connected clients
 * Used by API routes to emit real-time updates
 */

import { db } from '@/lib/db';
import { workflowInstances, workflowInstanceSteps, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Event emitter for real-time updates (uses Node.js EventEmitter pattern)
import { EventEmitter } from 'events';

// Create a global event emitter for workflow events
export const workflowEvents = new EventEmitter();

// Maximum listeners to prevent memory leaks
workflowEvents.setMaxListeners(100);

export type WorkflowServerEventType =
  | 'step:completed'
  | 'step:started'
  | 'evidence:uploaded'
  | 'ai:verified'
  | 'workflow:completed'
  | 'workflow:updated'
  | 'user:joined'
  | 'user:left';

export interface WorkflowServerEvent {
  type: WorkflowServerEventType;
  workflowInstanceId: string;
  stepId?: string;
  userId: string;
  timestamp: string;
  data?: Record<string, any>;
}

/**
 * Emit generic workflow event
 */
export async function emitWorkflowEvent(
  eventType: string,
  data: Record<string, any>
): Promise<void> {
  const event: WorkflowServerEvent = {
    type: 'workflow:updated',
    workflowInstanceId: data.executionId || 'all',
    userId: data.startedBy || 'system',
    timestamp: new Date().toISOString(),
    data: { eventType, ...data },
  };

  workflowEvents.emit(`workflow:${event.workflowInstanceId}`, event);
  workflowEvents.emit('workflow:all', event);

  console.log(`[WorkflowEvents] Event ${eventType} emitted`);
}

/**
 * Emit workflow step completed event
 */
export async function emitStepCompleted(
  workflowInstanceId: string,
  stepId: string,
  userId: string,
  data?: Record<string, any>
): Promise<void> {
  const event: WorkflowServerEvent = {
    type: 'step:completed',
    workflowInstanceId,
    stepId,
    userId,
    timestamp: new Date().toISOString(),
    data,
  };

  workflowEvents.emit(`workflow:${workflowInstanceId}`, event);
  workflowEvents.emit('workflow:all', event);

  console.log(`[WorkflowEvents] Step ${stepId} completed in workflow ${workflowInstanceId}`);
}

/**
 * Emit workflow step started event
 */
export async function emitStepStarted(
  workflowInstanceId: string,
  stepId: string,
  userId: string,
  data?: Record<string, any>
): Promise<void> {
  const event: WorkflowServerEvent = {
    type: 'step:started',
    workflowInstanceId,
    stepId,
    userId,
    timestamp: new Date().toISOString(),
    data,
  };

  workflowEvents.emit(`workflow:${workflowInstanceId}`, event);
  workflowEvents.emit('workflow:all', event);
}

/**
 * Emit evidence uploaded event
 */
export async function emitEvidenceUploaded(
  workflowInstanceId: string,
  stepId: string,
  userId: string,
  evidenceUrl: string,
  data?: Record<string, any>
): Promise<void> {
  const event: WorkflowServerEvent = {
    type: 'evidence:uploaded',
    workflowInstanceId,
    stepId,
    userId,
    timestamp: new Date().toISOString(),
    data: { evidenceUrl, ...data },
  };

  workflowEvents.emit(`workflow:${workflowInstanceId}`, event);
  workflowEvents.emit('workflow:all', event);

  console.log(`[WorkflowEvents] Evidence uploaded for step ${stepId} in workflow ${workflowInstanceId}`);
}

/**
 * Emit AI verification completed event
 */
export async function emitAiVerified(
  workflowInstanceId: string,
  stepId: string,
  userId: string,
  result: 'PASS' | 'FAIL' | 'PENDING',
  data?: Record<string, any>
): Promise<void> {
  const event: WorkflowServerEvent = {
    type: 'ai:verified',
    workflowInstanceId,
    stepId,
    userId,
    timestamp: new Date().toISOString(),
    data: { result, ...data },
  };

  workflowEvents.emit(`workflow:${workflowInstanceId}`, event);
  workflowEvents.emit('workflow:all', event);

  console.log(`[WorkflowEvents] AI verification ${result} for step ${stepId} in workflow ${workflowInstanceId}`);
}

/**
 * Emit workflow completed event
 */
export async function emitWorkflowCompleted(
  workflowInstanceId: string,
  userId: string,
  score?: number,
  data?: Record<string, any>
): Promise<void> {
  const event: WorkflowServerEvent = {
    type: 'workflow:completed',
    workflowInstanceId,
    userId,
    timestamp: new Date().toISOString(),
    data: { score, ...data },
  };

  workflowEvents.emit(`workflow:${workflowInstanceId}`, event);
  workflowEvents.emit('workflow:all', event);

  console.log(`[WorkflowEvents] Workflow ${workflowInstanceId} completed`);
}

/**
 * Emit workflow updated event
 */
export async function emitWorkflowUpdated(
  workflowInstanceId: string,
  userId: string,
  updateType: string,
  data?: Record<string, any>
): Promise<void> {
  const event: WorkflowServerEvent = {
    type: 'workflow:updated',
    workflowInstanceId,
    userId,
    timestamp: new Date().toISOString(),
    data: { updateType, ...data },
  };

  workflowEvents.emit(`workflow:${workflowInstanceId}`, event);
  workflowEvents.emit('workflow:all', event);
}

/**
 * Get current workflow state for sync
 */
export async function getWorkflowState(workflowInstanceId: string): Promise<{
  instance: typeof workflowInstances.$inferSelect | null;
  steps: (typeof workflowInstanceSteps.$inferSelect)[];
  activeUsers: number;
}> {
  try {
    const instance = await db.query.workflowInstances.findFirst({
      where: eq(workflowInstances.id, workflowInstanceId),
    });

    const steps = await db.query.workflowInstanceSteps.findMany({
      where: eq(workflowInstanceSteps.instanceId, workflowInstanceId),
    });

    // Get active user count from event listeners
    const activeUsers = workflowEvents.listenerCount(`workflow:${workflowInstanceId}`);

    return {
      instance: instance || null,
      steps,
      activeUsers,
    };
  } catch (error) {
    console.error('[WorkflowEvents] Failed to get workflow state:', error);
    return {
      instance: null,
      steps: [],
      activeUsers: 0,
    };
  }
}

/**
 * Subscribe to workflow events
 */
export function subscribeToWorkflow(
  workflowInstanceId: string,
  callback: (event: WorkflowServerEvent) => void
): () => void {
  const handler = (event: WorkflowServerEvent) => callback(event);

  workflowEvents.on(`workflow:${workflowInstanceId}`, handler);

  // Return unsubscribe function
  return () => {
    workflowEvents.off(`workflow:${workflowInstanceId}`, handler);
  };
}

/**
 * Subscribe to all workflow events
 */
export function subscribeToAllWorkflows(
  callback: (event: WorkflowServerEvent) => void
): () => void {
  const handler = (event: WorkflowServerEvent) => callback(event);

  workflowEvents.on('workflow:all', handler);

  // Return unsubscribe function
  return () => {
    workflowEvents.off('workflow:all', handler);
  };
}

// Export for use in API routes
export default {
  emitStepCompleted,
  emitStepStarted,
  emitEvidenceUploaded,
  emitAiVerified,
  emitWorkflowCompleted,
  emitWorkflowUpdated,
  getWorkflowState,
  subscribeToWorkflow,
  subscribeToAllWorkflows,
  workflowEvents,
};
