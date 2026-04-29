/**
 * WebSocket Server for Real-time Workflow Synchronization
 *
 * Uses native WebSocket for Next.js compatibility
 * Enables real-time sync between WhatsApp and Web workflows
 */

import { WebSocketServer, WebSocket } from 'ws';
import { verify } from 'jsonwebtoken';

// Workflow event types
export type WorkflowEventType =
  | 'step_completed'
  | 'step_started'
  | 'evidence_uploaded'
  | 'ai_verified'
  | 'workflow_completed'
  | 'workflow_updated'
  | 'user_joined'
  | 'user_left';

export interface WorkflowEvent {
  type: WorkflowEventType;
  workflowInstanceId: string;
  stepId?: string;
  userId: string;
  timestamp: string;
  data?: Record<string, any>;
}

interface ClientConnection {
  socket: WebSocket;
  userId: string;
  workflowInstanceId: string;
  joinedAt: Date;
}

// Global client store - keyed by workflow instance ID
const clients: Map<string, Map<string, ClientConnection>> = new Map();

/**
 * Initialize WebSocket server
 * Should be called from server setup (e.g., custom server or API route)
 */
export function initializeWebSocketServer(port?: number): WebSocketServer {
  const wss = new WebSocketServer({
    port: port || parseInt(process.env.WS_PORT || '3001'),
    path: '/ws/workflows',
  });

  wss.on('connection', (socket: WebSocket, req) => {
    console.log('[WebSocket] New connection attempt');

    // Extract token from URL query string
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const token = url.searchParams.get('token');
    const workflowInstanceId = url.searchParams.get('workflowId');

    if (!token || !workflowInstanceId) {
      socket.close(4001, 'Missing token or workflowId');
      return;
    }

    // Verify JWT token
    try {
      const decoded = verify(token, process.env.JWT_SECRET || 'default-secret') as {
        userId: string;
        exp: number;
      };

      const userId = decoded.userId;

      // Validate token not expired
      if (decoded.exp * 1000 < Date.now()) {
        socket.close(4002, 'Token expired');
        return;
      }

      // Register client
      registerClient(socket, userId, workflowInstanceId);

      // Send confirmation
      socket.send(JSON.stringify({
        type: 'connected',
        workflowInstanceId,
        userId,
        timestamp: new Date().toISOString(),
      }));

      console.log(`[WebSocket] Client ${userId} joined workflow ${workflowInstanceId}`);

    } catch (error) {
      console.error('[WebSocket] Token verification failed:', error);
      socket.close(4003, 'Invalid token');
    }
  });

  console.log(`[WebSocket] Server started on port ${port || 3001}`);
  return wss;
}

/**
 * Register a new client connection
 */
function registerClient(
  socket: WebSocket,
  userId: string,
  workflowInstanceId: string
): void {
  // Get or create workflow room
  if (!clients.has(workflowInstanceId)) {
    clients.set(workflowInstanceId, new Map());
  }

  const room = clients.get(workflowInstanceId)!;

  // Store client connection
  room.set(userId, {
    socket,
    userId,
    workflowInstanceId,
    joinedAt: new Date(),
  });

  // Handle messages from client
  socket.on('message', (data: Buffer) => {
    try {
      const message = JSON.parse(data.toString());
      handleClientMessage(userId, workflowInstanceId, message);
    } catch (error) {
      console.error('[WebSocket] Failed to parse message:', error);
    }
  });

  // Handle disconnect
  socket.on('close', () => {
    unregisterClient(userId, workflowInstanceId);
  });

  socket.on('error', (error) => {
    console.error(`[WebSocket] Error for user ${userId}:`, error);
    unregisterClient(userId, workflowInstanceId);
  });

  // Broadcast user joined event
  broadcastToWorkflow(workflowInstanceId, {
    type: 'user_joined',
    workflowInstanceId,
    userId,
    timestamp: new Date().toISOString(),
    data: { userCount: room.size },
  }, userId); // Exclude sender
}

/**
 * Unregister a client connection
 */
function unregisterClient(userId: string, workflowInstanceId: string): void {
  const room = clients.get(workflowInstanceId);
  if (room) {
    room.delete(userId);

    // Clean up empty rooms
    if (room.size === 0) {
      clients.delete(workflowInstanceId);
    } else {
      // Broadcast user left
      broadcastToWorkflow(workflowInstanceId, {
        type: 'user_left',
        workflowInstanceId,
        userId,
        timestamp: new Date().toISOString(),
        data: { userCount: room.size },
      });
    }
  }

  console.log(`[WebSocket] Client ${userId} left workflow ${workflowInstanceId}`);
}

/**
 * Handle messages from clients
 */
function handleClientMessage(
  senderUserId: string,
  workflowInstanceId: string,
  message: any
): void {
  // Validate message structure
  if (!message.type || !message.data) {
    console.warn('[WebSocket] Invalid message format:', message);
    return;
  }

  // Create workflow event
  const event: WorkflowEvent = {
    type: message.type as WorkflowEventType,
    workflowInstanceId,
    userId: senderUserId,
    stepId: message.data.stepId,
    timestamp: new Date().toISOString(),
    data: message.data,
  };

  // Broadcast to all other clients in the same workflow
  broadcastToWorkflow(workflowInstanceId, event, senderUserId);

  console.log(`[WebSocket] Event ${event.type} from ${senderUserId} in workflow ${workflowInstanceId}`);
}

/**
 * Broadcast event to all clients in a workflow
 * @param excludeUserId - Optional user ID to exclude (typically the sender)
 */
export function broadcastToWorkflow(
  workflowInstanceId: string,
  event: WorkflowEvent,
  excludeUserId?: string
): void {
  const room = clients.get(workflowInstanceId);
  if (!room) return;

  const message = JSON.stringify(event);

  room.forEach((client, userId) => {
    // Skip excluded user
    if (excludeUserId && userId === excludeUserId) return;

    // Check socket is still open
    if (client.socket.readyState === WebSocket.OPEN) {
      client.socket.send(message);
    }
  });
}

/**
 * Get active connections for a workflow
 */
export function getWorkflowConnections(workflowInstanceId: string): number {
  const room = clients.get(workflowInstanceId);
  return room ? room.size : 0;
}

/**
 * Get total active connections
 */
export function getTotalConnections(): number {
  let total = 0;
  clients.forEach(room => {
    total += room.size;
  });
  return total;
}

/**
 * Server-side event emitter - used by API routes to broadcast events
 */
export const workflowEventEmitter = {
  emitStepCompleted: (
    workflowInstanceId: string,
    stepId: string,
    userId: string,
    data?: Record<string, any>
  ): void => {
    broadcastToWorkflow(workflowInstanceId, {
      type: 'step_completed',
      workflowInstanceId,
      stepId,
      userId,
      timestamp: new Date().toISOString(),
      data,
    });
  },

  emitStepStarted: (
    workflowInstanceId: string,
    stepId: string,
    userId: string,
    data?: Record<string, any>
  ): void => {
    broadcastToWorkflow(workflowInstanceId, {
      type: 'step_started',
      workflowInstanceId,
      stepId,
      userId,
      timestamp: new Date().toISOString(),
      data,
    });
  },

  emitEvidenceUploaded: (
    workflowInstanceId: string,
    stepId: string,
    userId: string,
    evidenceUrl: string,
    data?: Record<string, any>
  ): void => {
    broadcastToWorkflow(workflowInstanceId, {
      type: 'evidence_uploaded',
      workflowInstanceId,
      stepId,
      userId,
      timestamp: new Date().toISOString(),
      data: { evidenceUrl, ...data },
    });
  },

  emitAiVerified: (
    workflowInstanceId: string,
    stepId: string,
    userId: string,
    result: 'PASS' | 'FAIL' | 'PENDING',
    data?: Record<string, any>
  ): void => {
    broadcastToWorkflow(workflowInstanceId, {
      type: 'ai_verified',
      workflowInstanceId,
      stepId,
      userId,
      timestamp: new Date().toISOString(),
      data: { result, ...data },
    });
  },

  emitWorkflowCompleted: (
    workflowInstanceId: string,
    userId: string,
    score?: number,
    data?: Record<string, any>
  ): void => {
    broadcastToWorkflow(workflowInstanceId, {
      type: 'workflow_completed',
      workflowInstanceId,
      userId,
      timestamp: new Date().toISOString(),
      data: { score, ...data },
    });
  },

  emitWorkflowUpdated: (
    workflowInstanceId: string,
    userId: string,
    updateType: string,
    data?: Record<string, any>
  ): void => {
    broadcastToWorkflow(workflowInstanceId, {
      type: 'workflow_updated',
      workflowInstanceId,
      userId,
      timestamp: new Date().toISOString(),
      data: { updateType, ...data },
    });
  },
};

export default {
  initializeWebSocketServer,
  broadcastToWorkflow,
  getWorkflowConnections,
  getTotalConnections,
  workflowEventEmitter,
};
